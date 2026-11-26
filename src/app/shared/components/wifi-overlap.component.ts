import { Component, Input, OnInit } from '@angular/core';

// Zigbee (IEEE 802.15.4, 2.4 GHz): channel k is centred on 2405 + 5 (k - 11) MHz and is 2 MHz wide
const ZIGBEE_CHANNELS = Array.from({ length: 16 }, (_, i) => 11 + i);
const ZIGBEE_HALF_WIDTH = 1;
// Wi-Fi (2.4 GHz): channel n is centred on 2407 + 5 n MHz and is 20 MHz wide (802.11g/n/ax, 20 MHz)
const WIFI_CHANNELS = Array.from({ length: 13 }, (_, i) => 1 + i);
const WIFI_HALF_WIDTH = 10;
// The strip runs from the left edge of Zigbee 11 to the right edge of Zigbee 26, 5 MHz per slot
const STRIP_START = 2402.5;
const STRIP_WIDTH = 80;

const STORAGE_KEY = 'z4d.wifi.channels';

// The usual non-overlapping sets; a single channel is the user's own access point
const PRESETS: Record<string, number[]> = {
  usual: [1, 6, 11],
  europe: [1, 5, 9, 13]
};

const zigbeeMHz = (channel: number) => 2405 + 5 * (channel - 11);
const wifiMHz = (channel: number) => 2407 + 5 * channel;

interface Umbrella {
  channel: number;
  left: number;
  width: number;
  lane: number;
}

interface ZigbeeSlot {
  channel: number;
  under: number[];
}

/**
 * Where the Zigbee channels sit under the Wi-Fi channels of the 2.4 GHz band, for the channel
 * screens (Network › Interference, Admin › Coordinator).
 *
 * Pure arithmetic on the channel plans: nothing is measured here. The Wi-Fi channels drawn are
 * 1, 6 and 11 by default, or the set the user picks (kept in this browser only).
 */
@Component({
  selector: 'app-wifi-overlap',
  templateUrl: './wifi-overlap.component.html',
  styleUrls: ['./wifi-overlap.component.scss'],
  standalone: false
})
export class WifiOverlapComponent implements OnInit {
  // Channel the network is on
  @Input() current: number | null = null;
  // Channel picked for a change (Admin › Coordinator)
  @Input() selected: number | null = null;

  readonly wifiChannels = WIFI_CHANNELS;
  choice = 'usual';
  umbrellas: Umbrella[] = [];
  lanes = 1;
  slots: ZigbeeSlot[] = [];

  ngOnInit() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && this.channelsOf(saved).length) {
        this.choice = saved;
      }
    } catch {
      // No storage (private window): keep the default
    }
    this.draw();
  }

  pick(choice: string) {
    this.choice = choice;
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // No storage: the choice lasts for this page only
    }
    this.draw();
  }

  get mine(): number | null {
    const channel = Number(this.choice);
    return WIFI_CHANNELS.includes(channel) ? channel : null;
  }

  // Wi-Fi channels a Zigbee channel sits under, among those drawn
  under(channel: number | null): number[] {
    return this.slots.find(slot => slot.channel === channel)?.under ?? [];
  }

  private channelsOf(choice: string): number[] {
    if (PRESETS[choice]) {
      return PRESETS[choice];
    }
    const channel = Number(choice);
    return WIFI_CHANNELS.includes(channel) ? [channel] : [];
  }

  private draw() {
    const wifi = this.channelsOf(this.choice);
    // Overlapping umbrellas (e.g. 1 and 5) go on separate lanes
    const laneEnds: number[] = [];
    this.umbrellas = wifi.map(channel => {
      const low = Math.max(wifiMHz(channel) - WIFI_HALF_WIDTH, STRIP_START);
      const high = Math.min(wifiMHz(channel) + WIFI_HALF_WIDTH, STRIP_START + STRIP_WIDTH);
      let lane = laneEnds.findIndex(end => end <= low);
      if (lane < 0) {
        lane = laneEnds.length;
      }
      laneEnds[lane] = high;
      return {
        channel,
        left: ((low - STRIP_START) / STRIP_WIDTH) * 100,
        width: ((high - low) / STRIP_WIDTH) * 100,
        lane
      };
    });
    this.lanes = Math.max(laneEnds.length, 1);
    this.slots = ZIGBEE_CHANNELS.map(channel => ({
      channel,
      under: wifi.filter(w => Math.abs(zigbeeMHz(channel) - wifiMHz(w)) < WIFI_HALF_WIDTH + ZIGBEE_HALF_WIDTH)
    }));
  }
}
