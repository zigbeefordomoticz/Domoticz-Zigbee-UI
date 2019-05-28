export interface Group {
  _GroupId: string;
  GroupName: string;
  Devices: Array<Device>;
  devicesSelected: Array<string>;
}

export interface Device {
  _NwkId: string;
  Ep: string;
}

export interface DevicesAvailable {
  _NwkId: string;
  ZDeviceName: string;
  WidgetList: Array<DeviceAvailable>;
}

export class DeviceAvailable {
  _ID: string;
  ZDeviceName: string;
  IEEE: string;
  Ep: string;
  Name: string;
}
