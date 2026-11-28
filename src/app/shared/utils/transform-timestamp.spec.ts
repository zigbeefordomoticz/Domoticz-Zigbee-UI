import { describe, expect, it } from 'vitest';
import { transformToTimestamp } from './transform-timestamp';

// 2 January 2026 03:04:05, local time: the pipe formats in the browser time zone
const epoch = new Date(2026, 0, 2, 3, 4, 5).getTime() / 1000;

describe('transformToTimestamp', () => {
  it.each(['TimeStamp', 'Stamp', 'Time', 'BatteryUpdateTime', 'PairingTime'])('formats %s', key => {
    expect(transformToTimestamp(key, epoch)).toBe('02/01/2026 03:04:05');
  });

  it('formats LastSeen', () => {
    expect(transformToTimestamp('LastSeen', epoch)).toBe('02/01/2026 03:04:05');
  });

  it('rounds fractional seconds', () => {
    expect(transformToTimestamp('Time', epoch + 0.4)).toBe('02/01/2026 03:04:05');
  });

  it('leaves 0 and negative values of a timestamp key as they are', () => {
    expect(transformToTimestamp('TimeStamp', 0)).toBe(0);
    expect(transformToTimestamp('TimeStamp', -1)).toBe(-1);
  });

  it('leaves other keys alone', () => {
    expect(transformToTimestamp('Model', epoch)).toBe(epoch);
  });
});
