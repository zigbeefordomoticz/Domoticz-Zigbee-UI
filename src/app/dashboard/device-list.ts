import { DeviceByName } from '@app/shared/models/device-by-name';
import { healthTone } from '@app/shared/utils/health-label.pipe';

// Same threshold as the dashboard "Battery below 15 %" item and Device Management
const LOW_BATTERY = 15;

/** What a bar, a chip or a "Needs attention" item asks the dashboard to list. */
export interface DeviceListRequest {
  title: string;
  // CSS colour of the dot next to the title: the segment colour, or the item tone
  color: string;
  devices: any[];
}

/** One line of the list. */
export interface DeviceListRow {
  nwkId: string;
  ieee: string;
  name: string;
  // false: no name given, the line shows the model (or the address) in italics
  named: boolean;
  model: string;
  health: string;
  tone: string;
  battery: number | null;
  lowBattery: boolean;
  // The /zdevice-name record the Details window needs; null when the plugin did not list the device there
  details: DeviceByName | null;
  search: string;
}

/**
 * A device from /zdevices or /zdevice-name, plus its /zdevice-name record when there is one.
 * Mains devices show no battery: the plugin keeps the last value read, or "".
 */
export function toDeviceListRow(device: any, details: DeviceByName | null): DeviceListRow {
  const source = details ?? device;
  const capabilities: string[] = Array.isArray(source.MacCapa) ? source.MacCapa : [];
  const mains = device.PowerSource === 'Main' || capabilities.includes('MainPower');
  const raw = source.Battery;
  const level = raw === '' || raw === null || raw === undefined || typeof raw === 'object' ? NaN : Number(raw);
  const battery = mains || isNaN(level) ? null : level;
  const name = source.ZDeviceName || '';
  const model = source.Model || device.Model || '';
  const nwkId = source._NwkId ?? device._NwkId ?? '';
  const ieee = source.IEEE ?? device.IEEE ?? '';
  return {
    nwkId,
    ieee,
    name: name || model || nwkId,
    named: name !== '',
    model,
    health: source.Health ?? '',
    tone: healthTone(source.Health),
    battery,
    lowBattery: battery !== null && battery <= LOW_BATTERY,
    details,
    search: [name, model, nwkId, ieee].join(' ').toLowerCase()
  };
}
