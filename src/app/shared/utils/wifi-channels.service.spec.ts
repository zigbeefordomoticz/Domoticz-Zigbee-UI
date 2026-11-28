import { beforeEach, describe, expect, it } from 'vitest';
import { WifiChannelsService } from './wifi-channels.service';

const zigbee = Array.from({ length: 16 }, (_, i) => 11 + i);
const clear = (service: WifiChannelsService) => zigbee.filter(channel => service.isClear(channel));

describe('WifiChannelsService', () => {
  beforeEach(() => localStorage.clear());

  it('starts on the usual 1 / 6 / 11 set, which leaves 15, 20, 25 and 26 clear', () => {
    const service = new WifiChannelsService();
    expect(service.preset).toBe('usual');
    expect(service.ap).toBeNull();
    expect(clear(service)).toEqual([15, 20, 25, 26]);
    expect(service.under(11)).toEqual([1]);
    expect(service.under(18)).toEqual([6]);
  });

  it('covers exactly four Zigbee channels per Wi-Fi channel, one header row', () => {
    const service = new WifiChannelsService();
    expect(service.rows).toHaveLength(1);
    const wifiCells = service.rows[0].filter(cell => cell.channel !== null);
    expect(wifiCells.map(cell => [cell.channel, cell.start, cell.span])).toEqual([
      [1, 0, 4],
      [6, 5, 4],
      [11, 10, 4]
    ]);
    // Every Zigbee column is under exactly one header cell
    expect(service.rows[0].reduce((total, cell) => total + cell.span, 0)).toBe(16);
  });

  it('leaves no channel clear with the European 1 / 5 / 9 / 13 set', () => {
    const service = new WifiChannelsService();
    service.pickPreset('europe');
    expect(clear(service)).toEqual([]);
    expect(localStorage.getItem('z4d.wifi.channels')).toBe('europe');
  });

  it('ignores an unknown preset', () => {
    const service = new WifiChannelsService();
    service.pickPreset('nonsense');
    expect(service.preset).toBe('usual');
  });

  it('adds the access point as a second row and to the overlaps', () => {
    const service = new WifiChannelsService();
    service.pickAp('3');
    expect(service.ap).toBe(3);
    expect(service.rows).toHaveLength(2);
    expect(service.rows[1].find(cell => cell.channel === 3)).toMatchObject({ mine: true, start: 2, span: 4 });
    expect(service.under(13)).toEqual([1, 3]);
    expect(service.underAp(15)).toBe(true);
    expect(service.underAp(20)).toBe(false);
    expect(clear(service)).toEqual([20, 25, 26]);
    expect(localStorage.getItem('z4d.wifi.ap')).toBe('3');
  });

  it('removes the access point on an empty or invalid value', () => {
    const service = new WifiChannelsService();
    service.pickAp(3);
    service.pickAp('');
    expect(service.ap).toBeNull();
    expect(service.rows).toHaveLength(1);
    expect(localStorage.getItem('z4d.wifi.ap')).toBeNull();
    service.pickAp(14);
    expect(service.ap).toBeNull();
  });

  it('restores both choices from this browser', () => {
    localStorage.setItem('z4d.wifi.channels', 'europe');
    localStorage.setItem('z4d.wifi.ap', '7');
    const service = new WifiChannelsService();
    expect([service.preset, service.ap]).toEqual(['europe', 7]);
  });

  it('reads an access point stored by the first version as the preset', () => {
    localStorage.setItem('z4d.wifi.channels', '6');
    const service = new WifiChannelsService();
    expect([service.preset, service.ap]).toEqual(['usual', 6]);
  });
});
