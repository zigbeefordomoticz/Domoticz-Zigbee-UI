/** A capture in progress is pending; n/a is a member without the Scenes cluster. */
export type SceneMemberStatus = 'pending' | 'synced' | 'failed' | 'n/a';

export type SceneCapability = 'native' | 'fallback';

/** The scenes on a device and the size of its table, which only a scan can give. */
export interface SceneSlots {
  used: number;
  total: number | null;
}

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
  // None on a member without the Scenes cluster
  sceneSlots: SceneSlots | null;
}

export interface Scene {
  groupId: string;
  sceneId: string;
  name: string;
  // Only known to the plugin, like the name: a scan cannot bring it back
  comment: string;
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
  // In the group but not in the scene, left out or come since: a capture can take them
  missing: SceneDevice[];
  synced: number;
  native: number;
}

export interface SceneRef {
  groupId: string;
  sceneId: string;
}

/** A new scene with a chosen ID: its capture waits for the scan, which starts or refuses it. */
export interface SceneScanCapture {
  sceneId: string;
  name: string;
  state: 'waiting' | 'started' | 'refused';
  // A code of group.scenes.error, when refused
  error: string | null;
}

/** The last scan of a group: the plugin does not keep it across a restart. */
export interface SceneScan {
  capture: SceneScanCapture | null;
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
  members: Array<SceneDevice & { nwkId: string; sceneSlots: SceneSlots | null }>;
  scenes: Scene[];
  scan: SceneScan | null;
}
