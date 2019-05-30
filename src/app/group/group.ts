export class Group {
  _GroupId: string;
  GroupName: string;
  Devices: Array<Device>;
  devicesSelected: Array<string>;
  coordinatorInside: boolean;
}

export interface Device {
  _NwkId: string;
  Ep: string;
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
