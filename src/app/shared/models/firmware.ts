export interface Firmware {
  ApplicationBuild: string;
  ApplicationRelease: string;
  FileName: string;
  ImageType: string;
  ManufCode: string;
  StackBuild: string;
  StackRelease: string;
  Version: string;
  label: string;
}

export interface FirmwareManufacturer {
  [key: string]: Firmware[];
}

export interface DevicesByManufacturer {
  DeviceName: string;
  Ep: string;
  Nwkid: string;
  SWBUILD_1: string;
  SWBUILD_3: string;
  label: string;
  OTALastTime: string;
  OTAType: string;
  OTAVersion: string;
  // From plugin 9.1.009: what the device reported in its last Query Next Image Request
  // ("" when it never asked). Absent with an older plugin.
  ImageType?: string;
  CurrentFileVersion?: string;
  // From plugin 9.1.009: one entry per image the device asked for, as a device may hold
  // several (NodOn SIN-4-FP-21: radio 0x0006, power board 0x0106). [] until the device asks
  // again after the plugin update; absent with an older plugin.
  Images?: DeviceOtaImage[];
}

export interface DeviceOtaImage {
  ImageType: string;
  ManufCode: string;
  CurrentFileVersion: string;
}

export class FirmwareUpdate {
  'NwkId': string;
  'Ep': string;
  'Brand': string;
  'FileName': string;
  'ForceUpdate': boolean;
}

export interface FirmwareUpdateResult {
  NwkId: string;
  Status: 'Queued' | 'Rejected' | 'Cancelled';
  Reason: string;
}

export interface FirmwareUpdateAnswer {
  Name: string;
  TimeStamp: number;
  // From plugin 9.1.009: one result per device. Absent with an older plugin.
  Results?: FirmwareUpdateResult[];
}

/**
 * An OTA request as `/plugin-health` lists it, in `OTAupdateRequests` (queued or in
 * progress) and `OTAupdateFinished` (the last ended ones, newest first).
 */
export interface OtaRequest {
  NwkId: string;
  IEEE: string;
  Name: string;
  FileName: string;
  State: 'Queued' | 'Notifying' | 'Waiting' | 'Transfer' | 'Stalled' | string;
  Status: 'Active' | 'Not Active';
  // "NN%" during a transfer; the outcome once ended (Success, Failed, Timeout, ...)
  Progress: string;
  QueuedTime: number;
  // Bytes requested so far, image size, and where / when the transfer began (0 before).
  // Absent with a plugin older than these fields.
  Offset?: number;
  Size?: number;
  StartOffset?: number;
  StartTime?: number;
  EndTime?: number;
}
