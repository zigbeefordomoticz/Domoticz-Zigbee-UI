export class Capabilities {
  Capabilities: Capability[];
  NwkId: string;
  Types: string[];
}

export interface Capability {
  actuator: string;
  Value: any;
  Type: boolean;
}
