export class NewHardware {
  NwkId: string;
  ProvisionStatus: string;
  ProvisionStatusDesc: string;
}

export class NewDevice {
  hardwares: Map<string, NewHardware>;
}
