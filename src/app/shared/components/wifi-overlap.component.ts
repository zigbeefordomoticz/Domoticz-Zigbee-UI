import { Component, Input } from '@angular/core';
import { WIFI_CHANNELS, WifiChannelsService } from '../utils/wifi-channels.service';

/**
 * Under the channel table of Network › Interference and of Admin › Coordinator: the key of the green channel
 * headers, the choice of Wi-Fi channels drawn over the table, whether the network's channel (and the one picked for a
 * change) sits under one of them, and the advice. The Wi-Fi channels themselves are drawn by the table, from
 * WifiChannelsService.
 */
@Component({
  selector: 'app-wifi-overlap',
  templateUrl: './wifi-overlap.component.html',
  styleUrls: ['./wifi-overlap.component.scss'],
  standalone: false
})
export class WifiOverlapComponent {
  // Channel the network is on
  @Input() current: number | null = null;
  // Channel picked for a change (Admin › Coordinator)
  @Input() selected: number | null = null;

  readonly wifiChannels = WIFI_CHANNELS;

  constructor(public wifi: WifiChannelsService) {}

  // The access point select works on strings; '' = not given
  get apValue(): string {
    return this.wifi.ap === null ? '' : String(this.wifi.ap);
  }

  // The network's channel, then the one picked for a change when it differs
  get checked(): number[] {
    return [this.current, this.selected === this.current ? null : this.selected].filter(c => c !== null);
  }
}
