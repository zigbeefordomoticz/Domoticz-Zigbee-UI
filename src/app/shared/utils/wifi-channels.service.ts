import { Injectable } from '@angular/core';

// Zigbee (IEEE 802.15.4, 2.4 GHz): channel k is centred on 2405 + 5 (k - 11) MHz and is 2 MHz wide
const ZIGBEE_CHANNELS = Array.from({ length: 16 }, (_, i) => 11 + i);
const ZIGBEE_HALF_WIDTH = 1;
// Wi-Fi (2.4 GHz): channel n is centred on 2407 + 5 n MHz and is 20 MHz wide (802.11g/n/ax, 20 MHz)
export const WIFI_CHANNELS = Array.from({ length: 13 }, (_, i) => 1 + i);
const WIFI_HALF_WIDTH = 10;

const STORAGE_KEY = 'z4d.wifi.channels';

// The usual non-overlapping sets; a single channel is the user's own access point
const PRESETS: Record<string, number[]> = {
  usual: [1, 6, 11],
  europe: [1, 5, 9, 13]
};

const zigbeeMHz = (channel: number) => 2405 + 5 * (channel - 11);
const wifiMHz = (channel: number) => 2407 + 5 * channel;

/** One header cell over the Zigbee channels: a Wi-Fi channel (channel set) or a gap (channel null). */
export interface WifiCell {
  channel: number | null;
  // Index of the first Zigbee channel covered (0 = channel 11) and how many follow
  start: number;
  span: number;
}

/**
 * Which Zigbee channels sit under which Wi-Fi channels, for the channel screens (Network › Interference,
 * Admin › Coordinator).
 *
 * Pure arithmetic on the channel plans: nothing is measured. A 20 MHz Wi-Fi channel always covers exactly four
 * Zigbee channels, so each one is drawn as one header cell spanning four channel columns. The Wi-Fi channels are
 * 1, 6 and 11 by default, or the set the user picks (kept in this browser only).
 */
@Injectable({ providedIn: 'root' })
export class WifiChannelsService {
  choice = 'usual';
  wifi: number[] = PRESETS['usual'];
  cells: WifiCell[] = [];
  private underMap = new Map<number, number[]>();

  constructor() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && this.channelsOf(saved).length) {
        this.choice = saved;
      }
    } catch {
      // No storage (private window): keep the default
    }
    this.compute();
  }

  pick(choice: string): void {
    if (!this.channelsOf(choice).length) {
      return;
    }
    this.choice = choice;
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // No storage: the choice lasts for this page only
    }
    this.compute();
  }

  /** Wi-Fi channels, among those shown, that a Zigbee channel sits under. */
  under(channel: number | null): number[] {
    return this.underMap.get(channel) ?? [];
  }

  isClear(channel: number): boolean {
    return !this.under(channel).length;
  }

  private channelsOf(choice: string): number[] {
    if (PRESETS[choice]) {
      return PRESETS[choice];
    }
    const channel = Number(choice);
    return WIFI_CHANNELS.includes(channel) ? [channel] : [];
  }

  private compute(): void {
    this.wifi = this.channelsOf(this.choice);
    this.underMap = new Map(
      ZIGBEE_CHANNELS.map(channel => [
        channel,
        this.wifi.filter(w => Math.abs(zigbeeMHz(channel) - wifiMHz(w)) < WIFI_HALF_WIDTH + ZIGBEE_HALF_WIDTH)
      ])
    );
    // Header cells left to right: a gap cell per uncovered channel, one cell per Wi-Fi channel
    this.cells = [];
    let index = 0;
    for (const w of [...this.wifi].sort((a, b) => a - b)) {
      const covered = ZIGBEE_CHANNELS.map((channel, i) => (this.underMap.get(channel).includes(w) ? i : -1)).filter(
        i => i >= 0
      );
      if (!covered.length || covered[0] < index) {
        // Off the Zigbee band, or overlapping the previous one: not drawn (no preset does this)
        continue;
      }
      for (; index < covered[0]; index++) {
        this.cells.push({ channel: null, start: index, span: 1 });
      }
      this.cells.push({ channel: w, start: covered[0], span: covered.length });
      index = covered[0] + covered.length;
    }
    for (; index < ZIGBEE_CHANNELS.length; index++) {
      this.cells.push({ channel: null, start: index, span: 1 });
    }
  }
}
