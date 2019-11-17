import { DeviceByName } from './device-by-name';
import { Ep } from './new-hardware';
export interface Widget {
  state: string;
  desc: string;
  device: DeviceByName;
  eps: Ep[];
}
