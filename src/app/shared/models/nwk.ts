export interface Channel {
  Channel: string;
  Level: number;
}

export interface NwkStat {
  _NwkId: string;
  Channels: Channel[];
  Failure: number;
  Tx: number;
  ZDeviceName: string;
}
