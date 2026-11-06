import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { GroupEndpoint } from '@app/shared/models/group';
import { GroupScenes, Scene, SceneRef } from '@app/shared/models/scene';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { sceneErrorText, sceneMemberKey, sceneNeedsAttention, scenePending, sceneTone } from './scene-helpers';

/** A name, and the scene of that name in each group. */
interface SceneEntry {
  key: string;
  name: string;
  scenes: Array<{ group: GroupScenes; scene: Scene }>;
  devices: number;
  synced: number;
  native: number;
  tone: string;
}

/**
 * Management › Groups & Scenes, by scene: Scene › Group › Device.
 *
 * On a device a scene belongs to one group, and it is the name that can be shared: "Cinema" on two
 * groups is two scenes, shown here as one with its two groups. They stay two scenes, which is why
 * they are captured, renamed and deleted from their group.
 */
@Component({
  selector: 'app-scenes-overview',
  templateUrl: './scenes-overview.component.html',
  styleUrls: ['./scenes-overview.component.scss'],
  standalone: false
})
export class ScenesOverviewComponent extends UnsubscribeOnDestroyAdapter implements OnChanges {
  @Input() groups: GroupScenes[] = [];
  @Input() endpoints: Map<string, GroupEndpoint> = new Map();
  @Output() changed = new EventEmitter<void>();
  @Output() openScene = new EventEmitter<SceneRef>();

  entries: SceneEntry[] = [];
  search = '';
  selectedKey: string | null = null;
  busy = false;

  readonly tone = sceneTone;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnChanges(): void {
    this.entries = this.toEntries();
  }

  get filteredEntries(): SceneEntry[] {
    const term = this.search.trim().toLowerCase();
    return term ? this.entries.filter(entry => this.matches(entry, term)) : this.entries;
  }

  /** The one picked, or the first: the page never opens on an empty side. */
  get selected(): SceneEntry | null {
    const entries = this.filteredEntries;
    return entries.find(entry => entry.key === this.selectedKey) ?? entries[0] ?? null;
  }

  groupNames(entry: SceneEntry): string {
    return entry.scenes.map(({ group }) => group.groupName).join(', ');
  }

  recall(scene: Scene): void {
    this.recallAll([scene], scene.name);
  }

  recallEverywhere(entry: SceneEntry): void {
    this.recallAll(
      entry.scenes.map(({ scene }) => scene),
      entry.name
    );
  }

  private recallAll(scenes: Scene[], name: string): void {
    this.busy = true;
    this.subs.sink = forkJoin(scenes.map(scene => this.apiService.recallScene(scene.groupId, scene.sceneId))).subscribe(
      {
        next: () => {
          this.busy = false;
          this.toastr.success(this.translate.instant('group.scenes.recalled', { name }));
          this.changed.emit();
        },
        error: error => {
          this.busy = false;
          this.toastr.error(sceneErrorText(error, this.translate), this.translate.instant('api.global.error.notify'));
          this.changed.emit();
        }
      }
    );
  }

  private toEntries(): SceneEntry[] {
    const entries = new Map<string, SceneEntry>();
    (this.groups || []).forEach(group =>
      group.scenes.forEach(scene => {
        // As the plugin compares names, when it refuses a duplicate in a group
        const key = scene.name.toLowerCase();
        const entry = entries.get(key) ?? {
          key,
          name: scene.name,
          scenes: [],
          devices: 0,
          synced: 0,
          native: 0,
          tone: 'success'
        };
        entry.scenes.push({ group, scene });
        entry.devices += scene.members.length;
        entry.synced += scene.synced;
        entry.native += scene.native;
        entries.set(key, entry);
      })
    );
    return [...entries.values()]
      .map(entry => ({ ...entry, tone: this.entryTone(entry) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private entryTone(entry: SceneEntry): string {
    const scenes = entry.scenes.map(({ scene }) => scene);
    if (scenes.some(scenePending)) {
      return 'secondary';
    }
    return scenes.some(sceneNeedsAttention) ? 'warning' : 'success';
  }

  private matches(entry: SceneEntry, term: string): boolean {
    return entry.scenes.some(({ group, scene }) => {
      const widgets = scene.members.flatMap(
        member => this.endpoints.get(sceneMemberKey(member.ieee, member.endpoint))?.widgets ?? []
      );
      return [scene.name, group.groupName, group.groupId, ...scene.members.map(member => member.name), ...widgets].some(
        text => (text || '').toLowerCase().includes(term)
      );
    });
  }
}
