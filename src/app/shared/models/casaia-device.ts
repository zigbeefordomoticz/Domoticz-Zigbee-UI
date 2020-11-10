export class CasaiaDevice {
  IEEE: string;
  IRCode: string;
  Model: string;
  Name: string;
  NwkId: string;
}

export class UpdateCasaiaDevice {
  IRCode: string;
  NwkId: string;
  constructor(IRCode: string, NwkId: string) {
    this.IRCode = IRCode;
    this.NwkId = NwkId;
  }
}
