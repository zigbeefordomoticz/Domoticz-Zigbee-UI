import { DeviceByName } from './device-by-name';
export interface Widget {
  state: string;
  desc: string;
  device: DeviceByName;
}
