import { Injectable } from '@angular/core';

// Zigbee (IEEE 802.15.4, 2.4 GHz): channel k is centred on 2405 + 5 (k - 11) MHz and is 2 MHz wide
const ZIGBEE_CHANNELS = Array.from({ length: 16 }, (_, i) => 11 + i);
const ZIGBEE_HALF_WIDTH = 1;
// Wi-Fi (2.4 GHz): channel n is centred on 2407 + 5 n MHz and is 20 MHz wide (802.11g/n/ax, 20 MHz)
export const WIFI_CHANNELS = Array.from({ length: 13 }, (_, i) => 1 + i);
const WIFI_HALF_WIDTH = 10;

const PRESET_KEY = 'z4d.wifi.channels';
const AP_KEY = 'z4d.wifi.ap';

// The usual non-overlapping sets, drawn on the first row: the Wi-Fi channels around (neighbours)
const PRESETS: Record<string, number[]> = {
  usual: [1, 6, 11],
  europe: [1, 5, 9, 13]
};

const zigbeeMHz = (channel: number) => 2405 + 5 * (channel - 11);
const wifiMHz = (channel: number) => 2407 + 5 * channel;
const overlaps = (zigbee: number, wifi: number) =>
  Math.abs(zigbeeMHz(zigbee) - wifiMHz(wifi)) < WIFI_HALF_WIDTH + ZIGBEE_HALF_WIDTH;

/** One header cell over the Zigbee channels: a Wi-Fi channel (channel set) or a gap (channel null). */
export interface WifiCell {
  channel: number | null;
  // The user's own access point
  mine: boolean;
  // Index of the first Zigbee channel covered (0 = channel 11) and how many follow
  start: number;
  span: number;
}

/**
 * Which Zigbee channels sit under which Wi-Fi channels, for the channel screens (Network › Interference,
 * Admin › Coordinator).
 *
 * Pure arithmetic on the channel plans: nothing is measured. A 20 MHz Wi-Fi channel always covers exactly four
 * Zigbee channels, so each one is drawn as one header cell spanning four channel columns. Two rows: the usual set
 * (1, 6, 11 or 1, 5, 9, 13), then the user's own access point when given; it may overlap two of the first row, so
 * it has its own row. Both choices are kept in this browser only.
 */
@Injectable({ providedIn: 'root' })
export class WifiChannelsService {
  preset = 'usual';
  // The access point's channel, or null when not given
  ap: number | null = null;
  rows: WifiCell[][] = [];
  private underMap = new Map<number, number[]>();

  constructor() {
    try {
      const saved = localStorage.getItem(PRESET_KEY);
      if (saved && PRESETS[saved]) {
        this.preset = saved;
      } else if (saved && WIFI_CHANNELS.includes(Number(saved))) {
        // Stored by the first version, where the access point replaced the set
        this.ap = Number(saved);
      }
      const ap = Number(localStorage.getItem(AP_KEY));
      if (WIFI_CHANNELS.includes(ap)) {
        this.ap = ap;
      }
    } catch {
      // No storage (private window): keep the defaults
    }
    this.compute();
  }

  pickPreset(preset: string): void {
    if (PRESETS[preset]) {
      this.preset = preset;
      this.store(PRESET_KEY, preset);
      this.compute();
    }
  }

  pickAp(value: string | number | null): void {
    const ap = Number(value);
    this.ap = value !== null && value !== '' && WIFI_CHANNELS.includes(ap) ? ap : null;
    this.store(AP_KEY, this.ap === null ? null : String(this.ap));
    this.compute();
  }

  /** Wi-Fi channels drawn (both rows) that a Zigbee channel sits under. */
  under(channel: number | null): number[] {
    return this.underMap.get(channel) ?? [];
  }

  underAp(channel: number | null): boolean {
    return this.ap !== null && channel !== null && overlaps(channel, this.ap);
  }

  isClear(channel: number): boolean {
    return !this.under(channel).length;
  }

  private store(key: string, value: string | null): void {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch {
      // No storage: the choice lasts for this page only
    }
  }

  private compute(): void {
    const wifi = [...new Set([...PRESETS[this.preset], ...(this.ap === null ? [] : [this.ap])])];
    this.underMap = new Map(
      ZIGBEE_CHANNELS.map(channel => [channel, wifi.filter(w => overlaps(channel, w)).sort((a, b) => a - b)])
    );
    this.rows = [this.row(PRESETS[this.preset], false)];
    if (this.ap !== null) {
      this.rows.push(this.row([this.ap], true));
    }
  }

  // Header cells left to right: a gap cell per uncovered channel, one cell per Wi-Fi channel
  private row(wifi: number[], mine: boolean): WifiCell[] {
    const cells: WifiCell[] = [];
    let index = 0;
    for (const w of [...wifi].sort((a, b) => a - b)) {
      const covered = ZIGBEE_CHANNELS.map((channel, i) => (overlaps(channel, w) ? i : -1)).filter(i => i >= 0);
      if (!covered.length || covered[0] < index) {
        // Off the Zigbee band, or overlapping the previous one: not drawn (no preset does this)
        continue;
      }
      for (; index < covered[0]; index++) {
        cells.push({ channel: null, mine, start: index, span: 1 });
      }
      cells.push({ channel: w, mine, start: covered[0], span: covered.length });
      index = covered[0] + covered.length;
    }
    for (; index < ZIGBEE_CHANNELS.length; index++) {
      cells.push({ channel: null, mine, start: index, span: 1 });
    }
    return cells;
  }
}
