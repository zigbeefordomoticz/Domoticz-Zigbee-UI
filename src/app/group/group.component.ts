import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { ZDevices } from '@app/shared/models/device';
import type { GroupEndpoint } from '@app/shared/models/group';
import { DevicesAvailable, Group } from '@app/shared/models/group';
import { GroupScenes, SceneRef } from '@app/shared/models/scene';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription, forkJoin, of, timer } from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import {
  POLL_WHILE_PENDING_MS,
  healthTone,
  isSectionFolded,
  saveSectionFolded,
  sceneMemberKey,
  sceneNeedsAttention,
  sceneWorkRunning
} from './scene-helpers';

const NATIVE_SCENES_SETTING = 'enableNativeScenes';
const FOLDED_SECTION = 'members';

// One to four hex digits, as typed: the plugin takes four. Above 0xfff7 is reserved by the ZCL
const GROUP_ID_INPUT = /^[0-9a-f]{1,4}$/i;
const MAX_GROUP_ID = 0xfff7;
// What the plugin refuses a chosen id with, as translation keys
const GROUP_ID_ERRORS: { [code: string]: string } = {
  GROUP_ID_INVALID: 'group.page.id.invalid',
  GROUP_ID_RESERVED: 'group.page.id.reserved',
  GROUP_ID_IN_USE: 'group.page.id.inuse'
};

// Plugin Health values, compared verbatim (see shared/utils/health-label.pipe.ts)
const NOT_REACHED = ['Not Reachable', 'TimedOut', 'Not seen last 24hours'];

// After a save the plugin changes a membership only when the device answers: read the groups again a few times
const REREAD_AFTER_SAVE_MS = [0, 3000, 8000];
const SCAN_POLL_MS = 5000;

type Endpoint = GroupEndpoint;

interface DraftMember extends Endpoint {
  status: 'kept' | 'added' | 'removed';
}

interface Draft {
  id: string | null;
  // The id asked for a new group, as typed. Empty: the plugin chooses
  requestedId: string;
  name: string;
  coordinator: boolean;
  members: DraftMember[];
  // What the group was when the editor opened: changes are counted against it, not against a newer read
  baseName: string;
  baseCoordinator: boolean;
}

interface GroupRow {
  group: Group;
  members: Endpoint[];
  coordinator: boolean;
  down: number;
}

/**
 * Management › Group: the Zigbee groups, one at a time in an editor.
 *
 * `PUT /zgroup` takes the whole list of groups (GrpWebServices.process_web_request on stable9):
 * - a group without `_GroupId` is created, and the plugin stops there: the rest of the list is not read.
 *   A new group is therefore always sent alone.
 * - an existing group gets exactly the members sent; a current member left out is asked to leave.
 *   Every member is sent back, even those this page cannot offer (an IKEA remote, a battery device),
 *   minus the ones removed here.
 * - a group missing from the list is deleted.
 * The coordinator is a member like any other: an entry with its NwkId in `devicesSelected`.
 */
@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss'],
  standalone: false
})
export class GroupComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  enabled = true;
  loaded = false;
  scanStatus: string | null = null;

  // Native scenes: nothing calls /scenes before the setting says so. Null while there is nothing to show,
  // as on a plugin not restarted since the setting changed
  scenesEnabled = false;
  sceneGroups: GroupScenes[] | null = null;
  byScene = false;
  focusScene: SceneRef | null = null;
  endpoints = new Map<string, Endpoint>();
  membersCollapsed = isSectionFolded(FOLDED_SECTION);

  readonly healthTone = healthTone;

  rows: GroupRow[] = [];
  groupable = new Map<string, Endpoint>();
  coordinatorNwkId = '0000';
  coordinatorIeee = '';

  search = '';
  addSearch = '';
  // The member picker: its list shows while the field has the focus; addActive is the row Enter adds
  addOpen = false;
  addActive = 0;
  selectedId: string | null = null;
  draft: Draft | null = null;
  pendingSelect: string | 'new' | null = null;
  confirmDelete = false;
  saving = false;
  sent = false;
  restartNeeded = false;

  private devices = new Map<string, ZDevices>();
  private scanPoll: Subscription | null = null;
  private sceneRead: Subscription | null = null;
  private scenePoll: Subscription | null = null;

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.apiService.getPluginhealth().subscribe(health => {
      // GroupStatus is missing when group management is off; /zgroup then answers nothing useful
      this.enabled = health?.GroupStatus !== undefined;
      this.scanStatus = health?.GroupStatus ?? null;
      if (this.enabled) {
        this.load();
        if (this.scanStatus === 'scan') {
          this.followScan();
        }
        this.readScenesSetting();
      } else {
        this.loaded = true;
      }
    });
  }

  // ---- membership scan --------------------------------------------------------------------------

  /** As in Admin › Group: it asks every router, and only queues the requests. */
  scanGroups(): void {
    this.apiService.getRescanGroup().subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
      this.scanStatus = 'scan';
      this.followScan();
      this.apiService.getRestartNeeded().subscribe(restart => {
        if (restart?.RestartNeeded === 1) {
          this.headerService.setRestart(true);
        }
      });
    });
  }

  // GroupStatus is "scan" while the plugin sends the requests; the groups are read again once it is done
  private followScan(): void {
    this.scanPoll?.unsubscribe();
    this.scanPoll = timer(SCAN_POLL_MS, SCAN_POLL_MS)
      .pipe(concatMap(() => this.apiService.getPluginhealth()))
      .subscribe(health => {
        this.scanStatus = health?.GroupStatus ?? null;
        if (this.scanStatus !== 'scan') {
          this.scanPoll?.unsubscribe();
          this.scanPoll = null;
          this.load();
        }
      });
    this.subs.sink = this.scanPoll;
  }

  // ---- scenes -----------------------------------------------------------------------------------

  private readScenesSetting(): void {
    this.subs.sink = this.apiService.getSettings().subscribe(settings => {
      const setting = (settings || [])
        .flatMap(theme => theme.ListOfSettings || [])
        .find(candidate => candidate.Name === NATIVE_SCENES_SETTING);
      this.scenesEnabled =
        !!setting && !['0', 'false'].includes(String(setting.current_value)) && !!setting.current_value;
      this.readScenes();
    });
  }

  /** Read again while a capture or a scan goes on: both end on the plugin side. */
  readScenes(): void {
    if (!this.scenesEnabled) {
      return;
    }
    this.scenePoll?.unsubscribe();
    this.sceneRead?.unsubscribe();
    this.sceneRead = this.apiService.getAllScenes().subscribe({
      next: groups => {
        this.sceneGroups = groups || [];
        if (this.sceneGroups.some(sceneWorkRunning)) {
          this.scenePoll = timer(POLL_WHILE_PENDING_MS).subscribe(() => this.readScenes());
          this.subs.sink = this.scenePoll;
        }
      },
      error: error => {
        if (error?.error?.error === 'SCENES_DISABLED') {
          this.sceneGroups = null;
          this.byScene = false;
        }
      }
    });
    this.subs.sink = this.sceneRead;
  }

  showGroups(): void {
    this.byScene = false;
    this.focusScene = null;
  }

  showScenes(): void {
    this.byScene = true;
    this.readScenes();
  }

  /** From the view by scene to the group, where a scene is changed. */
  openScene(scene: SceneRef): void {
    this.focusScene = scene;
    this.byScene = false;
    this.select(scene.groupId);
  }

  sceneCountOf(groupId: string): number {
    return this.sceneGroups?.find(group => group.groupId === groupId)?.scenes.length ?? 0;
  }

  get sceneCount(): number {
    return (this.sceneGroups || []).reduce((count, group) => count + group.scenes.length, 0);
  }

  get groupsWithScenes(): number {
    return (this.sceneGroups || []).filter(group => group.scenes.length).length;
  }

  get scenesToCheck(): number {
    return (this.sceneGroups || []).flatMap(group => group.scenes).filter(sceneNeedsAttention).length;
  }

  // ---- figures ----------------------------------------------------------------------------------

  get devicesInAGroup(): number {
    return new Set(this.rows.flatMap(row => row.members.map(member => member.nwkId))).size;
  }

  /** Devices the plugin offers for groups that are in none yet. */
  get groupableNotInAGroup(): number {
    const inAGroup = new Set(this.rows.flatMap(row => row.members.map(member => member.nwkId)));
    return new Set([...this.groupable.values()].map(endpoint => endpoint.nwkId).filter(nwkId => !inAGroup.has(nwkId)))
      .size;
  }

  get groupsWithCoordinator(): number {
    return this.rows.filter(row => row.coordinator).length;
  }

  get groupsNeedingAttention(): number {
    return this.rows.filter(row => row.down > 0).length;
  }

  // ---- list ------------------------------------------------------------------------------------

  get filteredRows(): GroupRow[] {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      return this.rows;
    }
    return this.rows.filter(
      row =>
        row.group.GroupName.toLowerCase().includes(term) ||
        row.group._GroupId.toLowerCase().includes(term) ||
        row.members.some(member => this.matches(member, term))
    );
  }

  /** Open a group (or a new one); with unsaved changes, ask first. */
  select(id: string | 'new'): void {
    if (this.draft && this.changes > 0 && id !== (this.draft.id ?? 'new')) {
      this.pendingSelect = id;
      return;
    }
    this.open(id);
  }

  confirmSwitch(): void {
    const id = this.pendingSelect;
    this.pendingSelect = null;
    this.open(id);
  }

  // ---- editor ----------------------------------------------------------------------------------

  get selectedRow(): GroupRow | undefined {
    return this.rows.find(row => row.group._GroupId === this.draft?.id);
  }

  get changes(): number {
    if (!this.draft) {
      return 0;
    }
    return (
      this.draft.members.filter(member => member.status !== 'kept').length +
      (this.draft.name.trim() !== this.draft.baseName ? 1 : 0) +
      (this.draft.coordinator !== this.draft.baseCoordinator ? 1 : 0)
    );
  }

  /** A new group always shows them: choosing its members is the point. */
  get membersHidden(): boolean {
    return this.membersCollapsed && !!this.draft?.id;
  }

  toggleMembers(): void {
    this.membersCollapsed = !this.membersCollapsed;
    saveSectionFolded(FOLDED_SECTION, this.membersCollapsed);
  }

  get membersAfterSave(): number {
    return this.draft ? this.draft.members.filter(member => member.status !== 'removed').length : 0;
  }

  get valid(): boolean {
    return (
      !!this.draft &&
      !!this.draft.name.trim() &&
      !this.requestedIdProblem &&
      (this.membersAfterSave > 0 || this.draft.coordinator)
    );
  }

  /** The id asked for a new group, as the plugin wants it. */
  get requestedId(): string | null {
    const id = this.draft?.requestedId.trim().toLowerCase();
    return id ? id.padStart(4, '0') : null;
  }

  /** A translation key. The plugin also refuses its ping group, which the page does not know. */
  get requestedIdProblem(): string | null {
    const id = this.requestedId;
    if (!id) {
      return null;
    }
    if (!GROUP_ID_INPUT.test(id)) {
      return 'group.page.id.invalid';
    }
    if (parseInt(id, 16) === 0 || parseInt(id, 16) > MAX_GROUP_ID) {
      return 'group.page.id.reserved';
    }
    return this.rows.some(row => row.group._GroupId === id) ? 'group.page.id.inuse' : null;
  }

  /** Every endpoint that can still join, by name; typing narrows the list, an empty field shows them all. */
  get candidates(): Endpoint[] {
    if (!this.draft) {
      return [];
    }
    const term = this.addSearch.trim().toLowerCase();
    const inDraft = new Set(this.draft.members.map(member => member.key));
    return [...this.groupable.values()]
      .filter(endpoint => !inDraft.has(endpoint.key) && (!term || this.matches(endpoint, term)))
      .sort((a, b) => this.addLabel(a).localeCompare(this.addLabel(b)) || a.key.localeCompare(b.key));
  }

  addLabel(endpoint: Endpoint): string {
    return endpoint.widgets.join(' · ') || endpoint.deviceName || endpoint.nwkId;
  }

  openAdd(): void {
    this.addOpen = true;
    this.addActive = 0;
  }

  onAddSearch(): void {
    this.addOpen = true;
    this.addActive = 0;
  }

  /** Arrow keys move in the list, Enter adds the marked row, Escape closes the list. */
  onAddKey(event: KeyboardEvent): void {
    const count = this.addOpen ? this.candidates.length : 0;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!this.addOpen) {
          this.openAdd();
          return;
        }
        if (count) {
          this.addActive = (this.addActive + (event.key === 'ArrowDown' ? 1 : count - 1)) % count;
          this.showActive();
        }
        break;
      case 'Enter':
        if (count) {
          event.preventDefault();
          this.add(this.candidates[Math.min(this.addActive, count - 1)]);
        }
        break;
      case 'Escape':
        if (this.addOpen) {
          event.preventDefault();
          this.addOpen = false;
        }
        break;
    }
  }

  toggleRemove(member: DraftMember): void {
    if (member.status === 'added') {
      this.draft.members = this.draft.members.filter(other => other !== member);
    } else {
      member.status = member.status === 'removed' ? 'kept' : 'removed';
    }
  }

  add(endpoint: Endpoint): void {
    this.draft.members.push({ ...endpoint, status: 'added' });
    // The list stays open on the next one, to add several in a row
    this.addSearch = '';
    this.addActive = Math.min(this.addActive, Math.max(this.candidates.length - 1, 0));
  }

  private showActive(): void {
    setTimeout(() => document.getElementById('group-add-' + this.addActive)?.scrollIntoView({ block: 'nearest' }));
  }

  discard(): void {
    this.open(this.draft?.id ?? null);
  }

  save(): void {
    if (!this.valid || this.saving) {
      return;
    }
    const draft = this.draft;
    // A new group goes alone: the plugin reads nothing after it
    const body = draft.id
      ? this.rows.map(row => (row.group._GroupId === draft.id ? this.payloadOfDraft(draft) : this.payloadOf(row)))
      : [this.payloadOfDraft(draft)];
    this.send(body, draft.id ?? this.requestedId, draft.name.trim());
  }

  delete(): void {
    const id = this.draft?.id;
    if (!id || this.saving) {
      return;
    }
    this.confirmDelete = false;
    this.send(
      this.rows.filter(row => row.group._GroupId !== id).map(row => this.payloadOf(row)),
      id,
      null
    );
  }

  // ---- data ------------------------------------------------------------------------------------

  private load(keepId: string | null = this.draft?.id ?? null, newName: string | null = null): void {
    this.subs.sink = forkJoin({
      available: this.apiService.getZGroupDevicesAvalaible().pipe(catchError(() => of([] as DevicesAvailable[]))),
      groups: this.apiService.getZGroups().pipe(catchError(() => of([] as Group[]))),
      devices: this.apiService.getZDevices().pipe(catchError(() => of([] as ZDevices[])))
    }).subscribe(({ available, groups, devices }) => {
      this.devices = new Map((devices || []).map(device => [device._NwkId, device]));
      this.readGroupable(available || []);
      this.rows = (Array.isArray(groups) ? groups : [])
        .map(group => this.toRow(group))
        .sort((a, b) => a.group._GroupId.localeCompare(b.group._GroupId));
      this.endpoints = new Map(
        [...this.rows.flatMap(row => row.members), ...this.groupable.values()].map(endpoint => [
          sceneMemberKey(endpoint.ieee, endpoint.ep),
          endpoint
        ])
      );
      this.loaded = true;
      this.readScenes();

      // A new group has no id until the plugin gives it one: find it by its name, highest id first
      const created = newName
        ? [...this.rows].reverse().find(row => row.group.GroupName === newName)?.group._GroupId
        : null;
      const target = created ?? keepId;
      // Edits made while the groups were read again are kept
      if (!this.draft || this.changes === 0) {
        this.open(
          this.rows.some(row => row.group._GroupId === target) ? target : (this.rows[0]?.group._GroupId ?? null)
        );
      }
    });
  }

  private send(body: object[], id: string | null, newName: string | null): void {
    this.saving = true;
    const chosenId = !!this.requestedId;
    (chosenId ? this.apiService.createZGroupWithId(body) : this.apiService.putZGroups(body)).subscribe({
      next: () => {
        this.saving = false;
        this.sent = true;
        this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
        this.apiService.getRestartNeeded().subscribe(restart => {
          this.restartNeeded = restart?.RestartNeeded > 0;
          if (this.restartNeeded) {
            this.headerService.setRestart(true);
          }
        });
        // Drop the draft so the re-read opens what the plugin now has
        this.draft = null;
        REREAD_AFTER_SAVE_MS.forEach(delay => {
          this.subs.sink = timer(delay).subscribe(() => this.load(id, newName && !id ? newName : null));
        });
      },
      error: error => {
        this.saving = false;
        if (chosenId) {
          const key = GROUP_ID_ERRORS[error?.error?.error];
          this.toastr.error(
            key ? this.translate.instant(key) : error?.status + ' ' + error?.statusText,
            this.translate.instant('api.global.error.notify')
          );
        }
      }
    });
  }

  private open(id: string | 'new' | null): void {
    if (this.focusScene?.groupId !== id) {
      this.focusScene = null;
    }
    this.confirmDelete = false;
    this.addSearch = '';
    if (id === 'new') {
      this.draft = {
        id: null,
        requestedId: '',
        name: '',
        coordinator: false,
        members: [],
        baseName: '',
        baseCoordinator: false
      };
      return;
    }
    const row = this.rows.find(other => other.group._GroupId === id);
    this.draft = row
      ? {
          id: row.group._GroupId,
          requestedId: '',
          name: row.group.GroupName,
          coordinator: row.coordinator,
          members: row.members.map(member => ({ ...member, status: 'kept' as const })),
          baseName: row.group.GroupName,
          baseCoordinator: row.coordinator
        }
      : null;
  }

  private readGroupable(available: DevicesAvailable[]): void {
    this.groupable = new Map();
    available.forEach((device, index) => {
      // The first entry is the coordinator
      if (index === 0 || device._NwkId === '0000') {
        this.coordinatorNwkId = device._NwkId || '0000';
        this.coordinatorIeee = device.WidgetList?.[0]?.IEEE ?? '';
        return;
      }
      (device.WidgetList || []).forEach(widget => {
        const key = endpointKey(device._NwkId, widget.Ep);
        const endpoint = this.groupable.get(key) ?? this.endpoint(device._NwkId, widget.Ep, widget.IEEE, true);
        if (widget.Name && !endpoint.widgets.includes(widget.Name)) {
          endpoint.widgets.push(widget.Name);
        }
        this.groupable.set(key, endpoint);
      });
    });
  }

  private toRow(group: Group): GroupRow {
    const members: Endpoint[] = [];
    let coordinator = false;
    (group.Devices || []).forEach(device => {
      if (device._NwkId === this.coordinatorNwkId || device._NwkId === '0000') {
        coordinator = true;
        return;
      }
      const key = endpointKey(device._NwkId, device.Ep);
      if (members.some(member => member.key === key)) {
        return;
      }
      members.push(this.groupable.get(key) ?? this.endpoint(device._NwkId, device.Ep, device.IEEE, false));
    });
    return {
      group,
      members,
      coordinator,
      down: members.filter(member => NOT_REACHED.includes(member.health)).length
    };
  }

  private endpoint(nwkId: string, ep: string, ieee: string, groupable: boolean): Endpoint {
    const device = this.devices.get(nwkId);
    return {
      key: endpointKey(nwkId, ep),
      nwkId,
      ep,
      ieee: ieee || device?.IEEE || '',
      widgets: [],
      deviceName: device?.ZDeviceName || nwkId,
      model: device?.Model || '',
      health: device?.Health ?? '',
      groupable
    };
  }

  /** What the plugin has for a group, sent back unchanged. */
  private payloadOf(row: GroupRow): object {
    return {
      _GroupId: row.group._GroupId,
      GroupName: row.group.GroupName,
      coordinatorInside: row.coordinator,
      devicesSelected: (row.group.Devices || []).map(device => ({
        _NwkId: device._NwkId,
        Ep: device.Ep,
        IEEE: device.IEEE
      }))
    };
  }

  private payloadOfDraft(draft: Draft): object {
    const devicesSelected = draft.members
      .filter(member => member.status !== 'removed')
      .map(member => ({ _NwkId: member.nwkId, Ep: member.ep, IEEE: member.ieee }));
    if (draft.coordinator) {
      // Keep the coordinator's endpoint as the plugin has it, 01 otherwise
      const current = (this.selectedRow?.group.Devices || []).find(
        device => device._NwkId === this.coordinatorNwkId || device._NwkId === '0000'
      );
      devicesSelected.push({
        _NwkId: current?._NwkId ?? this.coordinatorNwkId,
        Ep: current?.Ep ?? '01',
        IEEE: current?.IEEE || this.coordinatorIeee
      });
    }
    return {
      ...(draft.id ? { _GroupId: draft.id } : {}),
      // Never as _GroupId: the plugin skips an unknown one, then removes every group not in the list
      ...(this.requestedId ? { requestedGroupId: this.requestedId } : {}),
      GroupName: draft.name.trim(),
      coordinatorInside: draft.coordinator,
      devicesSelected
    };
  }

  private matches(endpoint: Endpoint, term: string): boolean {
    return [endpoint.deviceName, endpoint.model, endpoint.nwkId, ...endpoint.widgets].some(text =>
      (text || '').toLowerCase().includes(term)
    );
  }
}

function endpointKey(nwkId: string, ep: string): string {
  return `${nwkId}/${ep}`;
}
