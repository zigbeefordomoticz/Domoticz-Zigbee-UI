import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { GroupEndpoint } from '@app/shared/models/group';
import { GroupScenes, Scene, SceneDevice, SceneRef } from '@app/shared/models/scene';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, Subscription, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  POLL_WHILE_PENDING_MS,
  isSectionFolded,
  saveSectionFolded,
  sceneErrorText,
  sceneMemberKey,
  sceneTone,
  sceneWorkRunning
} from './scene-helpers';

const DEFAULT_TRANSITION = 1;
const MAX_TRANSITION = 65534;
const MAX_COMMENT_LENGTH = 200;
const MAX_NAME_LENGTH = 32;
// One or two hex digits, as typed: the plugin takes two
const SCENE_ID_INPUT = /^[0-9a-f]{1,2}$/i;
const FOLDED_SECTION = 'scenes';

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
 * Nothing calls /scenes before the setting says so, which the page reads: on a plugin without the
 * route it would raise an error and a Domoticz alert. The setting can be on while the plugin was
 * not restarted, and the route then answers SCENES_DISABLED.
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
  @Input() enabled = false;
  @Input() endpoints: Map<string, GroupEndpoint> = new Map();
  // Open this scene, coming from the view by scene
  @Input() focusScene: SceneRef | null = null;
  // A scene changed: the page shows figures on them
  @Output() changed = new EventEmitter<void>();

  readonly maxNameLength = MAX_NAME_LENGTH;
  readonly maxCommentLength = MAX_COMMENT_LENGTH;
  readonly maxTransition = MAX_TRANSITION;
  readonly tone = sceneTone;

  collapsed = isSectionFolded(FOLDED_SECTION);
  restartNeeded = false;
  view: GroupScenes | null = null;
  busy = false;

  newName = '';
  newTransition: number = DEFAULT_TRANSITION;
  newSceneId = '';
  newComment = '';
  newLeftOut = new Set<string>();

  expanded = new Set<string>();
  editing: { scene: Scene; name: string; comment: string; leftOut: Set<string> } | null = null;
  recapturing: { sceneId: string; transition: number; leftOut: Set<string> } | null = null;
  deleting: string | null = null;

  private reads = new Subject<string>();
  private poll: Subscription | null = null;
  private scrollTo: string | null = null;

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
    this.read();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.groupId) {
      this.view = null;
      this.closeForms();
      this.expanded.clear();
      this.newLeftOut = new Set();
    }
    if ((changes.groupId || changes.focusScene) && this.focusScene?.groupId === this.groupId) {
      // Open for this visit: a scene chosen in the view by scene has to be seen
      this.collapsed = false;
      this.expanded.add(this.focusScene.sceneId);
      this.scrollTo = this.focusScene.sceneId;
    }
    this.read();
  }

  override ngOnDestroy(): void {
    this.poll?.unsubscribe();
    super.ngOnDestroy();
  }

  toggleCollapsed(): void {
    this.collapsed = !this.collapsed;
    saveSectionFolded(FOLDED_SECTION, this.collapsed);
  }

  // ---- figures ----------------------------------------------------------------------------------

  get scanning(): boolean {
    return !!this.view?.scan?.running;
  }

  /** A capture waiting for its scan: the plugin takes no other new scene until then. */
  get checking(): boolean {
    return this.view?.scan?.capture?.state === 'waiting';
  }

  get refusal(): string | null {
    const capture = this.view?.scan?.capture;
    return capture?.state === 'refused' ? sceneErrorText({ error: { error: capture.error } }, this.translate) : null;
  }

  get directMembers(): string[] {
    return (this.view?.members || []).filter(member => member.capability === 'fallback').map(member => member.name);
  }

  hasFailed(scene: Scene): boolean {
    return scene.members.some(member => member.status === 'failed');
  }

  toggle(scene: Scene): void {
    if (!this.expanded.delete(scene.sceneId)) {
      this.expanded.add(scene.sceneId);
    }
  }

  // ---- actions ----------------------------------------------------------------------------------

  get canCreate(): boolean {
    return (
      !!this.newName.trim() &&
      this.validTransition(this.newTransition) &&
      this.validSceneId &&
      this.hasNative(this.view.members, this.newLeftOut)
    );
  }

  get validSceneId(): boolean {
    return !this.newSceneId.trim() || SCENE_ID_INPUT.test(this.newSceneId.trim());
  }

  /** The plugin refuses a scene with no device that can hold it: a recall would reach none. */
  hasNative(devices: SceneDevice[], leftOut: Set<string>): boolean {
    return devices.some(
      device => device.capability === 'native' && !leftOut.has(sceneMemberKey(device.ieee, device.endpoint))
    );
  }

  validTransition(value: number): boolean {
    return Number.isInteger(value) && value >= 0 && value <= MAX_TRANSITION;
  }

  scan(): void {
    this.act(this.apiService.scanGroupScenes(this.groupId));
  }

  create(): void {
    if (!this.canCreate) {
      return;
    }
    const sceneId = this.newSceneId.trim().toLowerCase().padStart(2, '0');
    const body = {
      name: this.newName.trim(),
      transitionTime: this.newTransition,
      comment: this.newComment.trim(),
      members: this.kept(this.view.members, this.newLeftOut),
      ...(this.newSceneId.trim() ? { sceneId } : {})
    };
    this.act(this.apiService.createScene(this.groupId, body), () => {
      this.newName = '';
      this.newTransition = DEFAULT_TRANSITION;
      this.newSceneId = '';
      this.newComment = '';
      this.newLeftOut = new Set();
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
    this.recapturing = {
      sceneId: scene.sceneId,
      transition: scene.transitionTime ?? DEFAULT_TRANSITION,
      leftOut: new Set(scene.missing.map(device => sceneMemberKey(device.ieee, device.endpoint)))
    };
  }

  recapture(): void {
    const { sceneId, transition, leftOut } = this.recapturing;
    const members = this.kept(this.view.members, leftOut);
    this.act(this.apiService.captureScene(this.groupId, sceneId, { transitionTime: transition, members }), () => {
      this.recapturing = null;
    });
  }

  startEdit(scene: Scene): void {
    this.closeForms();
    this.editing = { scene, name: scene.name, comment: scene.comment, leftOut: new Set() };
  }

  edit(): void {
    const { scene, name, comment, leftOut } = this.editing;
    const changes = { name: name.trim(), comment: comment.trim(), members: this.kept(scene.members, leftOut) };
    this.act(this.apiService.editScene(this.groupId, scene.sceneId, changes), () => {
      this.editing = null;
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
    this.editing = null;
    this.recapturing = null;
    this.deleting = null;
  }

  private kept(devices: SceneDevice[], leftOut: Set<string>): string[] {
    return devices.map(device => sceneMemberKey(device.ieee, device.endpoint)).filter(key => !leftOut.has(key));
  }

  private act(request: Observable<unknown>, done?: () => void): void {
    this.busy = true;
    this.subs.sink = request.subscribe({
      next: () => {
        this.busy = false;
        done?.();
        this.read();
        this.changed.emit();
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
    if (this.scrollTo) {
      const sceneId = this.scrollTo;
      this.scrollTo = null;
      setTimeout(() => document.getElementById('scene-' + sceneId)?.scrollIntoView({ block: 'center' }));
    }
    if (sceneWorkRunning(view)) {
      this.poll = timer(POLL_WHILE_PENDING_MS).subscribe(() => this.read());
    }
  }

  private showError(error: any): void {
    this.toastr.error(sceneErrorText(error, this.translate), this.translate.instant('api.global.error.notify'));
  }
}
