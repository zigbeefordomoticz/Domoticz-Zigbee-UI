import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { Plugin } from '@app/shared/models/plugin';
import { runningTransfers } from '@app/shared/utils/ota-transfers';
import { coordinatorChannel, pluginIdentity, PluginIdentity } from '@app/shared/utils/plugin-identity';
import { coordinatorTone, pluginTone, Tone } from '@app/shared/utils/status-tone';
import { pairingLeft, PairingStateService, PERMIT_TO_JOIN_PERMANENT } from '../pairing-state.service';

/**
 * Key figures and tabs on top of every Admin page.
 *
 * The status is read once when the page opens; the pairing state is shared with the Provisioning tab.
 */
@Component({
  selector: 'app-admin-tabs',
  templateUrl: './admin-tabs.component.html',
  styleUrls: ['../../shared/page-tabs.scss'],
  standalone: false
})
export class AdminTabsComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnChanges, AfterViewInit {
  @Input() active: string;
  @ViewChild('tabBar') tabBar: ElementRef<HTMLElement>;

  plugin: Plugin;
  identity: PluginIdentity;
  pluginTone: Tone = 'secondary';
  coordinatorTone: Tone = 'secondary';
  channel: number | null = null;
  permitToJoin: number | null = null;
  otaDevice: string | null = null;
  otaProgress: string | null = null;
  groupScan = false;
  restartNeeded = 0;

  readonly tabs = [
    { action: 'plugin', label: 'admin.plugin' },
    { action: 'pairing', label: 'admin.pairing' },
    { action: 'group', label: 'admin.group' },
    { action: 'coordinator', label: 'admin.coordinator' }
  ];

  // Tabs with their own address: /admin/<path>
  readonly pages = [
    { path: 'firmware', label: 'admin.firmware' },
    { path: 'command', label: 'tools.command' },
    { path: 'binding', label: 'tools.tabs.bindrep' }
  ];

  constructor(
    private apiService: ApiService,
    private pairingState: PairingStateService
  ) {
    super();
  }

  ngOnInit() {
    this.apiService.getPlugin().subscribe(plugin => {
      this.plugin = plugin;
      this.identity = pluginIdentity(plugin);
      this.pluginTone = pluginTone(plugin);
    });
    this.apiService.getCoordinator().subscribe(coordinator => (this.channel = coordinatorChannel(coordinator)));
    this.subs.sink = this.pairingState.seconds$.subscribe(seconds => (this.permitToJoin = seconds));
    this.pairingState.refresh().subscribe();
    this.apiService.getPluginhealth().subscribe(health => {
      this.coordinatorTone = coordinatorTone(health);
      const transfers = runningTransfers(health);
      this.otaDevice = transfers.map(transfer => transfer.nwkid).join(', ') || null;
      this.otaProgress = transfers.map(transfer => transfer.progress).join(', ');
      this.groupScan = health?.GroupStatus === 'scan';
    });
    this.apiService.getRestartNeeded().subscribe(result => (this.restartNeeded = result?.RestartNeeded ?? 0));
  }

  ngOnChanges() {
    this.showActiveTab();
  }

  ngAfterViewInit() {
    this.showActiveTab();
  }

  // On a phone the tabs scroll sideways: bring the active one into sight, without moving the page
  private showActiveTab() {
    setTimeout(() => {
      const bar = this.tabBar?.nativeElement;
      const tab = bar?.querySelector<HTMLElement>('.active');
      if (tab) {
        const offset = tab.getBoundingClientRect().left - bar.getBoundingClientRect().left;
        bar.scrollLeft += offset - (bar.clientWidth - tab.clientWidth) / 2;
      }
    });
  }

  // The library zigpy talks to the radio with, from the coordinator chosen in Domoticz (Mode1)
  get radio(): string {
    if (!this.plugin) {
      return '';
    }
    return this.plugin.Zigpy ? RADIO_LIBRARY[this.plugin.Mode1] || this.plugin.Mode1 || 'zigpy' : 'ZiGate';
  }

  get firmware(): string {
    return this.plugin?.CoordinatorFirmwareVersion || this.plugin?.FirmwareVersion || '—';
  }

  // IEEE 802.15.4, 2.4 GHz: channel 11 is 2405 MHz, then 5 MHz apart
  get megahertz(): number {
    return 2405 + 5 * (this.channel - 11);
  }

  get pairingOpen(): boolean {
    return this.permitToJoin > 0;
  }

  get pairingPermanent(): boolean {
    return this.permitToJoin === PERMIT_TO_JOIN_PERMANENT;
  }

  get pairingLeft(): string {
    return pairingLeft(this.permitToJoin);
  }
}

const RADIO_LIBRARY: Record<string, string> = {
  ZigpyZNP: 'Texas Instruments · zigpy-znp',
  ZigpyEZSP: 'Silicon Labs · bellows',
  ZigpydeCONZ: 'deCONZ · zigpy-deconz',
  ZigpyBLZ: 'Bouffalo Lab · zigpy-blz'
};
