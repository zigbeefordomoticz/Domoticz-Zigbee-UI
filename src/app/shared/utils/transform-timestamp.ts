import { DatePipe } from '@angular/common';

export function transformToTimestamp(key: any, value: any) {
  const datepipe = new DatePipe('en-US');
  const keyToTransform = ['TimeStamps', 'TimeStamp', 'Stamp', 'Time', 'StartTime', 'BatteryUpdateTime', 'TargetTime'];
  if (key === 'LastSeen') {
    return datepipe.transform(value * 1000, 'dd/MM/yyyy HH:mm:ss');
  } else if (keyToTransform.indexOf(key) > -1) {
    if (value > 0) {
      let calc = value * 1000;
      calc = Number(calc.toFixed(0));
      return datepipe.transform(calc, 'dd/MM/yyyy HH:mm:ss');
    } else {
      return value;
    }
  } else {
    return value;
  }
}
