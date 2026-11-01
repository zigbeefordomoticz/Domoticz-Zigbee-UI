import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { TopologyScanSummary } from '@app/shared/models/topology-scan';
import { coordinatorChannel } from '@app/shared/utils/plugin-identity';

/**
 * Key figures and tabs on top of the Network page, as on Admin.
 *
 * The figures are read once when the page opens. The footer keeps watching a
 * running topology scan; the Topology scan figure only says whether one was
 * running when the page opened.
 */
@Component({
  selector: 'app-network-tabs',
  templateUrl: './network-tabs.component.html',
  styleUrls: ['../../shared/page-tabs.scss'],
  standalone: false
})
export class NetworkTabsComponent implements OnInit {
  @Input() active: string;

  channel: number | null = null;
  routers: number | null = null;
  endDevices: number | null = null;
  lastScan: TopologyScanSummary | null = null;
  scansRead = false;
  scanRunning = false;
  lastInterference: number | null = null;
  interferenceReports = 0;
  interferenceRead = false;

  readonly tabs = [
    { view: 'mesh', label: 'network.mesh' },
    { view: 'topology', label: 'network.topo' },
    { view: 'interference', label: 'network.energy' }
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getCoordinator().subscribe(coordinator => (this.channel = coordinatorChannel(coordinator)));

    // Counted as on the Dashboard: disabled devices left out
    this.apiService.getZDevices().subscribe(devices => {
      const enabled = (devices || []).filter(device => device.Health !== 'Disabled');
      this.routers = enabled.filter(device => device.LogicalType === 'Router').length;
      this.endDevices = enabled.length - this.routers;
    });

    this.apiService.getTopologyScans().subscribe(scans => {
      this.lastScan = (scans || []).reduce<TopologyScanSummary | null>(
        (last, scan) => (!last || scan.timestamp > last.timestamp ? scan : last),
        null
      );
      this.scansRead = true;
    });

    this.apiService.getPluginhealth().subscribe(health => (this.scanRunning = !!health?.Topology));

    // `/nwk-stat` lists the stored reports by their timestamp, in seconds
    this.apiService.getNwkStats().subscribe(timestamps => {
      const times = (timestamps || []).map(Number).filter(time => !isNaN(time));
      this.interferenceReports = times.length;
      this.lastInterference = times.length ? Math.max(...times) : null;
      this.interferenceRead = true;
    });
  }

  // IEEE 802.15.4, 2.4 GHz: channel 11 is 2405 MHz, then 5 MHz apart
  get megahertz(): number {
    return 2405 + 5 * (this.channel - 11);
  }
}
