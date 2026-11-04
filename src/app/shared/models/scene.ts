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
  // A ZCL status such as "89", "timeout", "interrupted", or "absent" when a scan no longer finds it
  error?: string | null;
  // What the plugin last saw at the capture: none on a member a scan found
  snapshot?: { onOff: number | null; level: number | null };
}

export interface Scene {
  groupId: string;
  sceneId: string;
  name: string;
  // Whole seconds: the unit a device stores. Unknown (null) on a scene a scan found
  transitionTime: number | null;
  // Found on the devices by a scan, not captured by the plugin
  discovered: boolean;
  createdAt: number;
  // A capture or a rename
  updatedAt: number;
  // From the plugin only: a remote recalling it does not count
  lastRecalled: number | null;
  members: SceneMember[];
  // In the group but not in the scene: a capture brings them in
  missing: SceneDevice[];
  synced: number;
  native: number;
}

export interface SceneRef {
  groupId: string;
  sceneId: string;
}

/** The last scan of a group: the plugin does not keep it across a restart. */
export interface SceneScan {
  running: boolean;
  at: number;
  members: number;
  found: number;
  noAnswer: string[];
}

export interface GroupScenes {
  groupId: string;
  groupName: string;
  // At least one member has the Scenes cluster
  capable: boolean;
  members: Array<SceneDevice & { nwkId: string }>;
  scenes: Scene[];
  scan: SceneScan | null;
}
