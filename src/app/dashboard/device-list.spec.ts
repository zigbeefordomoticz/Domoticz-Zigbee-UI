import { describe, expect, it } from 'vitest';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { toDeviceListRow } from './device-list';

describe('toDeviceListRow', () => {
  it('builds a row from a /zdevices entry', () => {
    const row = toDeviceListRow(
      {
        _NwkId: 'a1b2',
        IEEE: '00158d0001AB',
        ZDeviceName: 'Kitchen',
        Model: 'lumi.sensor',
        Health: 'Live',
        Battery: 80
      },
      null
    );
    expect(row).toEqual({
      nwkId: 'a1b2',
      ieee: '00158d0001AB',
      name: 'Kitchen',
      named: true,
      model: 'lumi.sensor',
      health: 'Live',
      tone: 'success',
      battery: 80,
      lowBattery: false,
      details: null,
      search: 'kitchen lumi.sensor a1b2 00158d0001ab'
    });
  });

  it('falls back to the model, then to the address, for an unnamed device', () => {
    expect(toDeviceListRow({ _NwkId: 'a1b2', Model: 'TS0601' }, null)).toMatchObject({ name: 'TS0601', named: false });
    expect(toDeviceListRow({ _NwkId: 'a1b2' }, null)).toMatchObject({ name: 'a1b2', named: false });
  });

  it('prefers the /zdevice-name record when there is one', () => {
    const details = {
      _NwkId: 'a1b2',
      ZDeviceName: 'Renamed',
      Battery: 10,
      Health: 'TimedOut'
    } as unknown as DeviceByName;
    const row = toDeviceListRow({ _NwkId: 'a1b2', ZDeviceName: 'Old', Battery: 90 }, details);
    expect(row).toMatchObject({ name: 'Renamed', battery: 10, lowBattery: true, tone: 'warning', details });
  });

  it('shows no battery on a mains device', () => {
    expect(toDeviceListRow({ PowerSource: 'Main', Battery: 5 }, null)).toMatchObject({
      battery: null,
      lowBattery: false
    });
    expect(toDeviceListRow({ MacCapa: ['MainPower'], Battery: 5 }, null).battery).toBeNull();
  });

  it.each(['', null, undefined, {}, 'n/a'])('shows no battery for %j', battery => {
    expect(toDeviceListRow({ Battery: battery }, null).battery).toBeNull();
  });

  it('flags a battery at 15 % as low', () => {
    expect(toDeviceListRow({ Battery: '15' }, null)).toMatchObject({ battery: 15, lowBattery: true });
    expect(toDeviceListRow({ Battery: 16 }, null).lowBattery).toBe(false);
  });
});
