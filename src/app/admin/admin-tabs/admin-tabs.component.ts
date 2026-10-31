import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { Plugin } from '@app/shared/models/plugin';
import { coordinatorChannel, pluginIdentity, PluginIdentity } from '@app/shared/utils/plugin-identity';
import { interval } from 'rxjs';

// /permit-to-join answers the seconds left, 0 when closed and 255 for no time limit
const PERMIT_TO_JOIN_PERMANENT = 255;

/**
 * Status bar and tabs on top of every Admin page.
 *
 * The status is read once when the page opens; only the pairing countdown moves on its own.
 */
@Component({
  selector: 'app-admin-tabs',
  templateUrl: './admin-tabs.component.html',
  styleUrls: ['./admin-tabs.component.scss'],
  standalone: false
})
export class AdminTabsComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  @Input() active: string;

  plugin: Plugin;
  identity: PluginIdentity;
  channel: number | null = null;
  permitToJoin: number | null = null;
  otaDevice: string | null = null;
  otaProgress: string | null = null;
  restartNeeded = 0;

  readonly tabs = [
    { action: 'plugin', label: 'admin.plugin' },
    { action: 'pairing', label: 'admin.pairing' },
    { action: 'group', label: 'admin.group' },
    { action: 'coordinator', label: 'admin.coordinator' }
  ];

  constructor(private apiService: ApiService) {
    super();
  }

  ngOnInit() {
    this.apiService.getPlugin().subscribe(plugin => {
      this.plugin = plugin;
      this.identity = pluginIdentity(plugin);
    });
    this.apiService.getCoordinator().subscribe(coordinator => (this.channel = coordinatorChannel(coordinator)));
    this.apiService.getPermitToJoin().subscribe(result => (this.permitToJoin = result?.PermitToJoin ?? null));
    this.apiService.getPluginhealth().subscribe(health => {
      this.otaDevice = health?.OTAupdateDevice || null;
      this.otaProgress = health?.OTAupdateProgress ?? null;
    });
    this.apiService.getRestartNeeded().subscribe(result => (this.restartNeeded = result?.RestartNeeded ?? 0));
    this.subs.sink = interval(1000).subscribe(() => {
      if (this.permitToJoin > 0 && this.permitToJoin !== PERMIT_TO_JOIN_PERMANENT) {
        this.permitToJoin--;
      }
    });
  }

  get pairingOpen(): boolean {
    return this.permitToJoin > 0;
  }

  get pairingPermanent(): boolean {
    return this.permitToJoin === PERMIT_TO_JOIN_PERMANENT;
  }

  get pairingLeft(): string {
    const seconds = Math.max(0, this.permitToJoin ?? 0);
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
}
