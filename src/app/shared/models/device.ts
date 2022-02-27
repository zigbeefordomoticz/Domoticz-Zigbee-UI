export interface Device {
  BatteryLevel: number;
  DeviceID: string;
  ID: number;
  Name: string;
  SignaleLevel: number;
  SwitchType: number;
  TimedOut: number;
  Type: number;
  nValue: number;
  sValue: string;
}

export interface Ep {
  ClusterList: any[];
  Ep: string;
}

export interface LastCmd {
  CmdCode: string;
  TimeStamps: number;
}

export interface Stamp {
  LastSeen: number;
  MsgType: string;
  Time: string;
  time: number;
  LastPing?: number;
}

export interface WidgetList {
  WidgetName: string;
  WidgetType: string;
  _WidgetID: string;
}

export interface ZDevices {
  'App Version': string;
  Battery: any;
  ConsistencyCheck: string;
  DeviceType: string;
  Ep: Ep[];
  'HW Version': string;
  Health: string;
  IEEE: string;
  LQI: number;
  LastCmds: LastCmd[];
  LastSeen: number;
  LogicalType: string;
  Manufacturer: string;
  Model: string;
  PowerSource: string;
  ProfileID: string;
  ReceiveOnIdle: string;
  'Stack Version': string;
  Stamp: Stamp;
  Status: string;
  WidgetList: WidgetList[];
  ZDeviceID: string;
  ZDeviceName: string;
  _NwkId: string;
  Type: string;
}
