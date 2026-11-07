export interface DeviceByName {
  IEEE: string;
  MacCapa: Array<string>;
  Model?: string;
  Health: string;
  Status: string;
  WidgetList: Array<string>;
  ZDeviceName: string;
  _NwkId: string;
  Param?: string;
  CheckParam?: boolean;
  Battery?: any;
  ConsistencyCheck?: string;
  LQI?: number;
  RSSI?: number;
  CertifiedDevice?: boolean;
  // Set by the UI on a Green Power device of /zgp-device-raw: listed read-only, never sent back
  GreenPower?: boolean;
  // Green Power: time of the last frame (epoch seconds)
  LastSeen?: number;
}
