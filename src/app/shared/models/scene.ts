/** A capture in progress is pending; n/a is a member without the Scenes cluster. */
export type SceneMemberStatus = 'pending' | 'synced' | 'failed' | 'n/a';

export type SceneCapability = 'native' | 'fallback';

export interface SceneDevice {
  ieee: string;
  name: string;
  capability: SceneCapability;
  endpoint: string;
}

export interface SceneMember extends SceneDevice {
  nwkId: string;
  status: SceneMemberStatus;
  lastCheck?: number | null;
  // A ZCL status such as "89", "timeout" or "interrupted"
  error?: string | null;
  snapshot?: { onOff: number | null; level: number | null };
}

export interface Scene {
  groupId: string;
  sceneId: string;
  name: string;
  // Whole seconds: the unit a device stores
  transitionTime: number;
  lastRecalled: number | null;
  members: SceneMember[];
  // In the group but not in the scene: a capture brings them in
  missing: SceneDevice[];
  synced: number;
  native: number;
}

export interface GroupScenes {
  groupId: string;
  groupName: string;
  // At least one member has the Scenes cluster
  capable: boolean;
  members: Array<SceneDevice & { nwkId: string }>;
  scenes: Scene[];
}
