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
