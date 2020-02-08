export interface PluginStats {
  APSAck: number;
  APSNck: number;
  APSFailure: number;
  CRC: number;
  Cluster: number;
  CurrentLoad: number;
  FrameErrors: number;
  MaxLoad: number;
  ReTx: number;
  Received: number;
  Rxph: number;
  Rxpm: number;
  Rxps: number;
  Sent: number;
  StartTime: number;
  Trend: Trend[];
  Txph: number;
  Txpm: number;
  Txps: number;
  Uptime: number;
}

export interface Trend {
  Rxps: number;
  Txps: number;
  _TS: number;
  Load: number;
}
