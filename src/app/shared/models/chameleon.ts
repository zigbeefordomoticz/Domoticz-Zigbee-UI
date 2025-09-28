export class Chameleon {
  Nwkid: string;
  ZDeviceName: string;
  Identifiant: string;
  'Type de contrat': string;
  'Période tarifaire en cours': string;
  'Puissance Max contrat': number;
  Parameters: any[];
  ParametersForDisplay: ParameterForDisplay[];
}

export class ParameterForDisplay {
  key: string;
  value: string | number;
}
