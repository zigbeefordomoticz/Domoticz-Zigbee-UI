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

  it.each(['TimeStamp', 'LastSeen'])('leaves 0 and negative values of %s as they are', key => {
    // LastSeen 0: a device the plugin has not heard yet (Modules/heartbeat.py), not 1 January 1970
    expect(transformToTimestamp(key, 0)).toBe(0);
    expect(transformToTimestamp(key, -1)).toBe(-1);
  });

  it('works as the JSON.parse reviver of Tools > Data, nested Stamp included', () => {
    const device = JSON.parse(
      JSON.stringify({ Model: 'TS0601', Stamp: { LastSeen: 0, LastPing: epoch }, PairingTime: epoch }),
      transformToTimestamp
    );
    expect(device).toEqual({
      Model: 'TS0601',
      Stamp: { LastSeen: 0, LastPing: epoch },
      PairingTime: '02/01/2026 03:04:05'
    });
  });

  it('leaves other keys alone', () => {
    expect(transformToTimestamp('Model', epoch)).toBe(epoch);
  });
});
