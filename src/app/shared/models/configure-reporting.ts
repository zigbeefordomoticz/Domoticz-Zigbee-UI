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
