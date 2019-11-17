export class NewHardware {
  NwkId: string;
  ProvisionStatus: string;
  ProvisionStatusDesc: string;
  Ep: Ep[];
}

export interface Cluster {
  ClusterId: string;
  ClusterDesc: string;
}

export interface Ep {
  Ep: string;
  Clusters: Cluster[];
}

export class NewDevice {
  NewDevices: NewHardware[];
}
