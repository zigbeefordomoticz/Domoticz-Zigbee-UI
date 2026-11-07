export class Group {
  _GroupId: string;
  GroupName: string;
  Devices: Array<Device>;
  // Read from /zgroup (stable9 rest_Groups._zgroup_get)
  Cluster?: string;
  WidgetStyle?: string;
  devicesSelected: Array<any>;
  coordinatorInside: boolean;
}

export interface Device {
  _NwkId: string;
  Ep: string;
  IEEE?: string;
}

/** One device endpoint, the unit a group is made of. */
export interface GroupEndpoint {
  key: string;
  nwkId: string;
  ep: string;
  ieee: string;
  widgets: string[];
  deviceName: string;
  model: string;
  health: string;
  // false when the plugin does not offer it for groups now (battery device, IKEA remote, not ready…)
  groupable: boolean;
}

export class DevicesAvailable {
  _NwkId: string;
  WidgetList: Array<DeviceAvailable>;
}

export class DeviceAvailable {
  _ID: string;
  ZDeviceName: string;
  IEEE: string;
  Ep: string;
  Name: string;
  _NwkId: string;
}
