export interface DeviceByName {
  IEEE: string;
  MacCapa: Array<string>;
  Model?: string;
  Health: string;
  Status: string;
  WidgetList: Array<string>;
  ZDeviceName: string;
  _NwkId: string;
  Param?: string;
  CheckParam?: boolean;
  Battery?: any;
  ConsistencyCheck?: string;
  LQI?: number;
  RSSI?: number;
  CertifiedDevice?: boolean;
  // Set by the UI on a Green Power device of /zgp-device-raw: no name or parameters, never sent back
  GreenPower?: boolean;
  // Green Power: time of the last frame (epoch seconds)
  LastSeen?: number;
}

/**
 * A Green Power device of /zgp-device-raw as a row of a device list. Its NWK is the low
 * half of its source ID and may equal a Zigbee device's, so the row is keyed by the source ID.
 */
export function toGreenPowerRow(record: any): DeviceByName {
  const srcId =
    typeof record?.src_id === 'number'
      ? '0x' + record.src_id.toString(16).toUpperCase().padStart(8, '0')
      : String(record?.IEEE ?? '');
  return {
    IEEE: record?.IEEE ?? '',
    MacCapa: [],
    Model: record?.Model || '',
    Health: '',
    Status: 'inDB',
    WidgetList: Array.isArray(record?.WidgetList) ? record.WidgetList : [],
    ZDeviceName: '',
    _NwkId: srcId,
    LQI: typeof record?.LQI === 'number' ? record.LQI : undefined,
    LastSeen: typeof record?.LastSeen === 'number' ? record.LastSeen : undefined,
    CertifiedDevice: true,
    GreenPower: true
  };
}
