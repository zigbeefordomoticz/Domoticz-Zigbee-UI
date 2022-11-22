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
  Battery?: any;
  ConsistencyCheck?: string;
  LQI?: number;
  CertifiedDevice?: boolean;
}
