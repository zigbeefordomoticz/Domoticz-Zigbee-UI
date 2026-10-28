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
  Error: boolean;
}

export interface Trend {
  Rxps: number;
  Txps: number;
  _TS: number;
  Load: number;
  // Since plugin #2197: messages received / sent since the previous point, and the point's epoch
  Time?: number;
  RxCount?: number;
  TxCount?: number;
}
