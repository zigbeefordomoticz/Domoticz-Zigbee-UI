import { Component, Input } from '@angular/core';
import { GroupEndpoint } from '@app/shared/models/group';
import { Scene, SceneDevice, SceneMember } from '@app/shared/models/scene';
import { TranslateService } from '@ngx-translate/core';
import { healthTone, sceneMemberKey } from './scene-helpers';

// Why a member failed: anything else is a ZCL status, shown as it is
const KNOWN_MEMBER_ERRORS = ['timeout', 'interrupted', 'absent', '89'];

/**
 * The devices of one scene, from a group or from a scene.
 *
 * The state is what the plugin last saw at the capture: a native member stores the scene on its
 * own, and nothing reads it back. A member a scan found has none.
 */
@Component({
  selector: 'app-scene-members',
  templateUrl: './scene-members.component.html',
  styleUrls: ['./scene-members.component.scss'],
  standalone: false
})
export class SceneMembersComponent {
  @Input() scene: Scene;
  // What the Groups page knows of an endpoint and the scene view does not: widgets, model, health
  @Input() endpoints: Map<string, GroupEndpoint> = new Map();
  // Off where several tables follow each other, and the page says it once
  @Input() showHint = true;

  readonly healthTone = healthTone;

  constructor(private translate: TranslateService) {}

  endpoint(device: SceneDevice): GroupEndpoint | undefined {
    return this.endpoints.get(sceneMemberKey(device.ieee, device.endpoint));
  }

  label(device: SceneDevice): string {
    const endpoint = this.endpoint(device);
    return endpoint?.widgets.join(' · ') || device.name || endpoint?.deviceName || device.ieee;
  }

  problem(member: SceneMember): string | null {
    if (member.status !== 'failed') {
      return null;
    }
    return KNOWN_MEMBER_ERRORS.includes(member.error)
      ? this.translate.instant('group.scenes.failed.' + member.error)
      : this.translate.instant('group.scenes.failed.code', { code: member.error });
  }

  state(member: SceneMember): string {
    const snapshot = member.snapshot;
    if (!snapshot || (snapshot.onOff === null && snapshot.level === null)) {
      // A direct member is sent this state: without one, a recall leaves it alone
      return this.translate.instant(
        member.capability === 'fallback' ? 'group.scenes.direct.unknown' : 'group.scenes.state.unknown'
      );
    }
    if (snapshot.onOff === 0) {
      return this.translate.instant('group.scenes.direct.off');
    }
    return snapshot.level === null
      ? this.translate.instant('group.scenes.direct.on')
      : this.translate.instant('group.scenes.direct.level', { percent: Math.round((snapshot.level * 100) / 254) });
  }
}
