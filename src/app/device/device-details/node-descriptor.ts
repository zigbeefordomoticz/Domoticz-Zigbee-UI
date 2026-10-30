/**
 * The plugin's `_rawNodeDescriptor`: the descriptor section of its 0x8042 frame, as
 * Z4D_decoders/z4d_decoder_Node_Desc_Rsp.py stores it (zigpy mode builds the same frame). 13 bytes in hex,
 * each 16-bit field already big-endian, in the frame's order, not the descriptor's:
 *
 *   manufacturer(4) maxRx(4) maxTx(4) serverMask(4) descriptorCapability(2) macCapability(2) maxBuffer(2) bitField(4)
 *
 * The bit field is the descriptor's first two bytes swapped: APS flags + frequency band, then logical type
 * + complex / user descriptor flags (Classes/ZigpyTransport/AppGeneric.py, _node_descriptor_from_raw).
 */

export type LogicalType = 'coordinator' | 'router' | 'enddevice' | 'unknown';

export interface NodeDescriptor {
  raw: string;
  logicalType: LogicalType;
  complexDescriptor: boolean;
  userDescriptor: boolean;
  frequencyBands: string[];
  macCapability: number;
  alternatePanCoordinator: boolean;
  fullFunctionDevice: boolean;
  mainsPowered: boolean;
  receiverOnWhenIdle: boolean;
  securityCapable: boolean;
  allocateAddress: boolean;
  manufacturerCode: string;
  maxBufferSize: number;
  maxIncomingTransferSize: number;
  maxOutgoingTransferSize: number;
  serverMask: number;
  /** Server mask bits 0-6, by their key: primarytc, backuptc, primarybinding, backupbinding, primarydiscovery, backupdiscovery, networkmanager */
  serverRoles: string[];
  /** Server mask bits 9-15: 0 before Zigbee R21, else 21, 22, 23... */
  stackComplianceRevision: number;
  extendedActiveEndpointList: boolean;
  extendedSimpleDescriptorList: boolean;
}

const RAW_LENGTH = 26;
const LOGICAL_TYPES: LogicalType[] = ['coordinator', 'router', 'enddevice'];
const SERVER_ROLES = [
  'primarytc',
  'backuptc',
  'primarybinding',
  'backupbinding',
  'primarydiscovery',
  'backupdiscovery',
  'networkmanager'
];
// Frequency band bits of the descriptor's second byte (bits 3-7)
const BANDS: [number, string][] = [
  [3, '868 MHz'],
  [5, '902–928 MHz'],
  [6, '2.4 GHz']
];

const bit = (value: number, index: number) => (value & (1 << index)) !== 0;

export function decodeNodeDescriptor(raw: unknown): NodeDescriptor | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const hex = raw.trim();
  if (hex.length < RAW_LENGTH || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  const field = (start: number, length: number) => parseInt(hex.slice(start, start + length), 16);

  const serverMask = field(12, 4);
  const descriptorCapability = field(16, 2);
  const mac = field(18, 2);
  const apsAndBand = field(22, 2);
  const typeAndFlags = field(24, 2);

  return {
    raw: hex,
    logicalType: LOGICAL_TYPES[typeAndFlags & 0x07] ?? 'unknown',
    complexDescriptor: bit(typeAndFlags, 3),
    userDescriptor: bit(typeAndFlags, 4),
    frequencyBands: BANDS.filter(([index]) => bit(apsAndBand, index)).map(([, band]) => band),
    macCapability: mac,
    alternatePanCoordinator: bit(mac, 0),
    fullFunctionDevice: bit(mac, 1),
    mainsPowered: bit(mac, 2),
    receiverOnWhenIdle: bit(mac, 3),
    securityCapable: bit(mac, 6),
    allocateAddress: bit(mac, 7),
    manufacturerCode: hex.slice(0, 4).toLowerCase(),
    maxBufferSize: field(20, 2),
    maxIncomingTransferSize: field(4, 4),
    maxOutgoingTransferSize: field(8, 4),
    serverMask,
    serverRoles: SERVER_ROLES.filter((_, index) => bit(serverMask, index)),
    stackComplianceRevision: serverMask >> 9,
    extendedActiveEndpointList: bit(descriptorCapability, 0),
    extendedSimpleDescriptorList: bit(descriptorCapability, 1)
  };
}

/** RollingLQI: the plugin keeps the last 10 readings (a deque, served as a list); anything else is ignored. */
export function rollingLqi(value: unknown): number[] {
  return rolling(value, 0, 255);
}

/** RollingRSSI: the last 10 RSSI readings in dBm (a list); only radios that report RSSI fill it. */
export function rollingRssi(value: unknown): number[] {
  return rolling(value, -128, 0);
}

function rolling(value: unknown, min: number, max: number): number[] {
  return Array.isArray(value)
    ? value
        .map(Number)
        .filter(reading => Number.isFinite(reading) && reading >= min && reading <= max)
        .slice(-10)
    : [];
}
