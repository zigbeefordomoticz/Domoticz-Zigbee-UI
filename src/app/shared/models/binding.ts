export class Binding {
  sourceIeee: string;
  sourceEp: string;
  destIeee: string;
  destEp: string;
  cluster: string;
}

// One entry of /binding-table-disp: the device's binding table as the plugin last read it
export interface BindingTableEntry {
  sourceEp: string;
  Cluster: string;
  targetIEEE?: string;
  targetNwkId?: string;
  targetGroupId?: string;
  targetEp?: string;
  targetNickName?: string;
}

export interface BindingTable {
  Status: string;
  TimeStamp: number;
  BindingTableSize: number;
  // One single-key object per entry: { <source IEEE>: entry }
  Devices: Record<string, BindingTableEntry>[];
}
