export class Info {
  DataType: string;
  MinInterval: string;
  MaxInterval: string;
  TimeOut: string;
  Change: string;
}

export class Attribute {
  Attribute: string;
  Infos: Info[];
}

export class Configure {
  ClusterId: string;
  Attributes: Attribute[];
}

export class Edit {
  Nwkid: string;
  Clusters: Configure[];
}

export class ClusterToDisplay {
  clusterId: string;
  attributeId: string;
  dataType: string;
  timeOut: string;
  minInterval: string;
  maxInterval: string;
  change: string;
}

// How one attribute reports, as the device answered (/cfgrpt-read): intervals and change only when Status is 00
export interface ReportingRecord {
  Ep: string;
  ClusterId: string;
  Attribute: string;
  Status?: string;
  TimeStamp?: number;
  DataType?: string;
  MinInterval?: string;
  MaxInterval?: string;
  Change?: string;
}

export interface ReportingRead {
  TimeStamp: number | null;
  Records: ReportingRecord[];
}
