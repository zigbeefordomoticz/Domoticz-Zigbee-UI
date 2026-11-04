import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { GroupScenes, Scene, SceneMember } from '@app/shared/models/scene';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, Subscription, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

const NATIVE_SCENES_SETTING = 'enableNativeScenes';

// Each response has 30 s on the plugin side, which always ends a capture: the polling stops by itself
const POLL_WHILE_PENDING_MS = 2000;

const DEFAULT_TRANSITION = 1;
const MAX_TRANSITION = 65534;
const MAX_NAME_LENGTH = 32;

// The plugin refuses a request with {"error": <code>}, translated as group.scenes.error.<code>
const KNOWN_ERRORS = [
  'NAME_REQUIRED',
  'NAME_INVALID',
  'NAME_DUPLICATE',
  'TRANSITION_INVALID',
  'GROUP_NOT_FOUND',
  'SCENE_NOT_FOUND',
  'GROUP_NOT_ALLOWED',
  'NO_CAPABLE_MEMBER',
  'SCENE_ID_EXHAUSTED',
  'COORDINATOR_BUSY'
];

// Why a member failed: anything else is a ZCL status, shown as it is
const KNOWN_MEMBER_ERRORS = ['timeout', 'interrupted', '89'];

interface ReadResult {
  id: string;
  view?: GroupScenes;
  error?: any;
}

/**
 * Management › Group: the native Zigbee scenes of one group, under its members.
 *
 * A scene is captured from the lights as they are, so it does not go through the editor of the
 * group, nor wait for its Save. It works on the group as the plugin has it, not on the draft.
 *
 * Nothing calls /scenes before the setting says so: on a plugin without the route it would raise
 * an error and a Domoticz alert. The setting can be on while the plugin was not restarted, and the
 * route then answers SCENES_DISABLED.
 */
@Component({
  selector: 'app-group-scenes',
  templateUrl: './group-scenes.component.html',
  styleUrls: ['./group-scenes.component.scss'],
  standalone: false
})
export class GroupScenesComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnChanges, OnDestroy {
  @Input() groupId: string;
  // Changes whenever the page reads the groups again: members may have changed
  @Input() revision: unknown;

  readonly maxNameLength = MAX_NAME_LENGTH;
  readonly maxTransition = MAX_TRANSITION;

  enabled = false;
  restartNeeded = false;
  view: GroupScenes | null = null;
  busy = false;

  newName = '';
  newTransition: number = DEFAULT_TRANSITION;

  expanded = new Set<string>();
  renaming: { sceneId: string; name: string } | null = null;
  recapturing: { sceneId: string; transition: number } | null = null;
  deleting: string | null = null;

  private reads = new Subject<string>();
  private poll: Subscription | null = null;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit(): void {
    this.subs.sink = this.reads
      .pipe(
        switchMap(id =>
          this.apiService.getGroupScenes(id).pipe(
            map((view): ReadResult => ({ id, view })),
            catchError(error => of<ReadResult>({ id, error }))
          )
        )
      )
      .subscribe(result => this.onRead(result));

    this.subs.sink = this.apiService.getSettings().subscribe(settings => {
      const setting = (settings || [])
        .flatMap(theme => theme.ListOfSettings || [])
        .find(candidate => candidate.Name === NATIVE_SCENES_SETTING);
      this.enabled = !!setting && !['0', 'false'].includes(String(setting.current_value)) && !!setting.current_value;
      this.read();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.groupId) {
      this.view = null;
      this.closeForms();
      this.expanded.clear();
    }
    this.read();
  }

  override ngOnDestroy(): void {
    this.poll?.unsubscribe();
    super.ngOnDestroy();
  }

  // ---- figures ----------------------------------------------------------------------------------

  get directMembers(): string[] {
    return (this.view?.members || []).filter(member => member.capability === 'fallback').map(member => member.name);
  }

  tone(scene: Scene): string {
    if (scene.members.some(member => member.status === 'pending')) {
      return 'secondary';
    }
    return this.needsAttention(scene) ? 'warning' : 'success';
  }

  needsAttention(scene: Scene): boolean {
    return scene.synced < scene.native || scene.missing.length > 0;
  }

  hasFailed(scene: Scene): boolean {
    return scene.members.some(member => member.status === 'failed');
  }

  memberProblem(member: SceneMember): string | null {
    if (member.status !== 'failed') {
      return null;
    }
    return KNOWN_MEMBER_ERRORS.includes(member.error)
      ? this.translate.instant('group.scenes.failed.' + member.error)
      : this.translate.instant('group.scenes.failed.code', { code: member.error });
  }

  /** What a member without the Scenes cluster is sent at a recall. */
  directState(member: SceneMember): string {
    const snapshot = member.snapshot;
    if (!snapshot || (snapshot.onOff === null && snapshot.level === null)) {
      return this.translate.instant('group.scenes.direct.unknown');
    }
    if (snapshot.onOff === 0) {
      return this.translate.instant('group.scenes.direct.off');
    }
    return snapshot.level === null
      ? this.translate.instant('group.scenes.direct.on')
      : this.translate.instant('group.scenes.direct.level', { percent: Math.round((snapshot.level * 100) / 254) });
  }

  toggle(scene: Scene): void {
    if (!this.expanded.delete(scene.sceneId)) {
      this.expanded.add(scene.sceneId);
    }
  }

  // ---- actions ----------------------------------------------------------------------------------

  get canCreate(): boolean {
    return !!this.newName.trim() && this.validTransition(this.newTransition);
  }

  validTransition(value: number): boolean {
    return Number.isInteger(value) && value >= 0 && value <= MAX_TRANSITION;
  }

  create(): void {
    if (!this.canCreate) {
      return;
    }
    const body = { name: this.newName.trim(), transitionTime: this.newTransition };
    this.act(this.apiService.createScene(this.groupId, body), () => {
      this.newName = '';
      this.newTransition = DEFAULT_TRANSITION;
    });
  }

  recall(scene: Scene): void {
    this.act(this.apiService.recallScene(this.groupId, scene.sceneId), () =>
      this.toastr.success(this.translate.instant('group.scenes.recalled', { name: scene.name }))
    );
  }

  retry(scene: Scene): void {
    this.act(this.apiService.retryScene(this.groupId, scene.sceneId));
  }

  startRecapture(scene: Scene): void {
    this.closeForms();
    this.recapturing = { sceneId: scene.sceneId, transition: scene.transitionTime };
  }

  recapture(): void {
    const { sceneId, transition } = this.recapturing;
    this.act(this.apiService.captureScene(this.groupId, sceneId, { transitionTime: transition }), () => {
      this.recapturing = null;
    });
  }

  startRename(scene: Scene): void {
    this.closeForms();
    this.renaming = { sceneId: scene.sceneId, name: scene.name };
  }

  rename(): void {
    const { sceneId, name } = this.renaming;
    this.act(this.apiService.renameScene(this.groupId, sceneId, { name: name.trim() }), () => {
      this.renaming = null;
    });
  }

  startDelete(scene: Scene): void {
    this.closeForms();
    this.deleting = scene.sceneId;
  }

  delete(): void {
    const sceneId = this.deleting;
    this.act(this.apiService.deleteScene(this.groupId, sceneId), () => {
      this.deleting = null;
    });
  }

  closeForms(): void {
    this.renaming = null;
    this.recapturing = null;
    this.deleting = null;
  }

  private act(request: Observable<unknown>, done?: () => void): void {
    this.busy = true;
    this.subs.sink = request.subscribe({
      next: () => {
        this.busy = false;
        done?.();
        this.read();
      },
      error: error => {
        this.busy = false;
        this.showError(error);
      }
    });
  }

  // ---- data -------------------------------------------------------------------------------------

  private read(): void {
    if (this.enabled && this.groupId) {
      this.poll?.unsubscribe();
      this.poll = null;
      this.reads.next(this.groupId);
    }
  }

  private onRead({ id, view, error }: ReadResult): void {
    if (id !== this.groupId) {
      return;
    }
    if (error) {
      this.view = null;
      if (error.error?.error === 'SCENES_DISABLED') {
        this.restartNeeded = true;
      } else {
        this.showError(error);
      }
      return;
    }
    this.restartNeeded = false;
    this.view = view;
    if (view.scenes.some(scene => scene.members.some(member => member.status === 'pending'))) {
      this.poll = timer(POLL_WHILE_PENDING_MS).subscribe(() => this.read());
    }
  }

  private showError(error: any): void {
    const code = error?.error?.error;
    this.toastr.error(
      KNOWN_ERRORS.includes(code)
        ? this.translate.instant('group.scenes.error.' + code)
        : error?.status + ' ' + error?.statusText,
      this.translate.instant('api.global.error.notify')
    );
  }
}
