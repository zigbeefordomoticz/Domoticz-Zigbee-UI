export class Gamma {
  Nwkid: string;
  ZDeviceName: string;
  Identifiant: string;
  TICMode: string;
  'Type de contrat': string;
  'Période tarifaire en cours': string;
  'Puissance Max contrat': number;
  UpTime: string;
  Parameters: any[];
  ParametersForDisplay: ParameterForDisplay[];
}

export class ParameterForDisplay {
  key: string;
  value: string | number;
}
