import { DeviceByName } from './device-by-name';

export class NewHardware {
  NwkId: string;
  ProvisionStatus: string;
  ProvisionStatusDesc: string;
  IEEE: string;
  ProfileId: string;
  ProfileIdDesc: string;
  ZDeviceID: string;
  ZDeviceIDDesc: string;
  Model: string;
  PluginCertified: string;
  Ep: Ep[];
  device: DeviceByName;
  // Green Power device: not in /zdevice-name, so the plugin gives its widgets here
  GreenPower?: boolean;
  WidgetList?: string[];
}

export interface Cluster {
  ClusterId: string;
  ClusterDesc: string;
  fullName: string;
}

export interface Ep {
  Ep: string;
  Clusters: Cluster[];
}

export class NewDevice {
  NewDevices: NewHardware[];
}
