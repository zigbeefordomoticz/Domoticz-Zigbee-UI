export class NewHardware {
  NwkId: string;
  ProvisionStatus: string;
  ProvisionStatusDesc: string;
}

export class NewDevice {
  NewDevices: NewHardware[];
}
