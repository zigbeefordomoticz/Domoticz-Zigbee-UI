import { DatePipe } from '@angular/common';

// Epoch seconds in the plugin's device records. 0 means never: the plugin writes Stamp.LastSeen = 0
// for a device it has not heard yet (Modules/heartbeat.py), so 0 and below are shown as they are.
const TIMESTAMP_KEYS = [
  'TimeStamps',
  'TimeStamp',
  'Stamp',
  'Time',
  'StartTime',
  'LastSeen',
  'BatteryUpdateTime',
  'TargetTime',
  'BatteryPercentage_TimeStamp',
  'BatteryVoltage_TimeStamp',
  'PairingTime'
];

export function transformToTimestamp(key: any, value: any) {
  if (TIMESTAMP_KEYS.includes(key) && value > 0) {
    const datepipe = new DatePipe('en-US');
    return datepipe.transform(Number((value * 1000).toFixed(0)), 'dd/MM/yyyy HH:mm:ss');
  }
  return value;
}
