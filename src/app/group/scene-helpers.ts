import { GroupScenes, Scene } from '@app/shared/models/scene';
import { TranslateService } from '@ngx-translate/core';

// Each response has 30 s on the plugin side, which always ends a capture or a scan: the polling stops by itself
export const POLL_WHILE_PENDING_MS = 2000;
const SECTION_FOLDED_KEY = 'z4d.group.folded.';

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
  'SCENE_ID_INVALID',
  'SCENE_ID_IN_USE',
  'SCENE_ID_CHECK_RUNNING',
  'COORDINATOR_BUSY'
];

// Plugin Health values, compared verbatim (see shared/utils/health-label.pipe.ts)
const HEALTH_TONE: { [health: string]: string } = {
  Live: 'success',
  TimedOut: 'warning',
  'Not seen last 24hours': 'warning',
  'Not Reachable': 'danger',
  Disabled: 'secondary'
};

/** The sections of the group editor a viewer folded. Only a convenience: without storage they are all open. */
export function isSectionFolded(section: string): boolean {
  try {
    return localStorage.getItem(SECTION_FOLDED_KEY + section) === '1';
  } catch {
    return false;
  }
}

export function saveSectionFolded(section: string, folded: boolean): void {
  try {
    if (folded) {
      localStorage.setItem(SECTION_FOLDED_KEY + section, '1');
    } else {
      localStorage.removeItem(SECTION_FOLDED_KEY + section);
    }
  } catch {
    // Folded for this visit only
  }
}

export function healthTone(health: string): string {
  return HEALTH_TONE[health] ?? 'secondary';
}

export function sceneNeedsAttention(scene: Scene): boolean {
  return scene.synced < scene.native || scene.missing.length > 0;
}

export function scenePending(scene: Scene): boolean {
  return scene.members.some(member => member.status === 'pending');
}

export function sceneTone(scene: Scene): string {
  if (scenePending(scene)) {
    return 'secondary';
  }
  return sceneNeedsAttention(scene) ? 'warning' : 'success';
}

/** A capture or a scan is going on: its outcome only shows by reading again. */
export function sceneWorkRunning(view: GroupScenes): boolean {
  return !!view.scan?.running || view.scenes.some(scenePending);
}

export function sceneErrorText(error: any, translate: TranslateService): string {
  const code = error?.error?.error;
  return KNOWN_ERRORS.includes(code)
    ? translate.instant('group.scenes.error.' + code)
    : error?.status + ' ' + error?.statusText;
}

/** Keyed as in the store of the plugin. */
export function sceneMemberKey(ieee: string, ep: string): string {
  return `${ieee}-${ep}`;
}
