export class Zlinky {
  Nwkid: string;
  ZDeviceName: string;
  'PROTOCOL Linky': number;
  Parameters: any[];
  ParametersForDisplay: ParameterForDisplay[];
  protocole: string;
}

export class ParameterForDisplay {
  key: string;
  value: string | number;
}
