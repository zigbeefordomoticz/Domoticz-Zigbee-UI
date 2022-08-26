export class Zlinky {
  Nwkid: string;
  ZDeviceName: string;
  'Protocol Linky': number;
  Parameters: any[];
  ParametersForDisplay: ParameterForDisplay[];
}

export class ParameterForDisplay {
  key: string;
  value: string | number;
}
