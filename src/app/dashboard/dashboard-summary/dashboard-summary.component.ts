import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { Group } from '@app/shared/models/group';
import { Plugin } from '@app/shared/models/plugin';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { TranslateService } from '@ngx-translate/core';
import { FileSaverService } from 'ngx-filesaver';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

// Plugin Health values, compared verbatim (see shared/utils/health-label.pipe.ts)
const HEALTH_NOT_REACHABLE = 'Not Reachable';
const HEALTH_NOT_SEEN = 'Not seen last 24hours';
const LOW_BATTERY = 15;
// As git abbreviates a commit, and the plugin logs it (Modules/pluginHelpers.py)
const SHORT_COMMIT_LENGTH = 7;

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface KeyFigure {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  info?: string;
  link?: { route: string; text: string };
}

interface AttentionItem {
  category: string;
  tone: Tone;
  title: string;
  detail: string;
  count?: number;
  devices?: any[];
  route?: string;
  // Shown instead of detail; an entry with an href is a link
  entries?: { text: string; href?: string; title?: string }[];
  export: () => Observable<object>;
}

/**
 * Key figures and "Needs attention" on top of the dashboard.
 *
 * Everything is built from data the dashboard already loads; the only calls made here are on a
 * click: the error history (which marks the errors as read, as the Tools error page does).
 * Exports list chosen fields only: /plugin and /coordinator also carry credentials and the network key.
 */
@Component({
  selector: 'app-dashboard-summary',
  templateUrl: './dashboard-summary.component.html',
  styleUrls: ['./dashboard-summary.component.scss'],
  standalone: false
})
export class DashboardSummaryComponent implements OnChanges {
  @Input() pluginStats: PluginStats;
  @Input() devices: any[] = [];
  @Input() certified: any[] = [];
  @Input() plugin: Plugin;
  @Input() pluginHealth: any;
  @Input() groups: Group[] = [];
  @Input() coordinator: any;
  @Input() firmwareAvailable: any[] = [];
  @Input() healthTimeOutHours = 6;
  @Output() viewDevices = new EventEmitter<any[]>();

  figures: KeyFigure[] = [];
  items: AttentionItem[] = [];

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private translateService: TranslateService,
    private fileSaverService: FileSaverService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnChanges() {
    if (this.pluginStats) {
      this.build();
    }
  }

  view(item: AttentionItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    } else {
      this.viewDevices.emit(item.devices);
    }
  }

  download(item: AttentionItem) {
    item.export().subscribe(doc => this.save('z4d-' + item.category + '.json', { ...this.exportHeader(), ...doc }));
  }

  exportAll() {
    forkJoin(this.items.map(item => item.export())).subscribe(docs =>
      this.save('z4d-needs-attention.json', { ...this.exportHeader(), count: docs.length, items: docs })
    );
  }

  private build() {
    const devices = Array.isArray(this.devices) ? this.devices : [];
    const inDb = (device: any) => device.Status !== 'notDB';
    const byNwkId = new Map(devices.map(device => [device._NwkId, device]));

    const live = devices.filter(device => device.Health === 'Live' && inDb(device));
    const notReachable = devices.filter(
      device => (device.Health === HEALTH_NOT_REACHABLE && inDb(device)) || device.Status === 'Leave'
    );
    const notSeen = devices.filter(device => device.Health === HEALTH_NOT_SEEN && inDb(device));
    const lowBattery = devices
      .filter(
        device =>
          device.PowerSource === 'Battery' &&
          inDb(device) &&
          device.Health !== 'Disabled' &&
          device.Battery !== '' &&
          device.Battery !== null &&
          Number(device.Battery) <= LOW_BATTERY
      )
      .sort((a, b) => Number(a.Battery) - Number(b.Battery));
    const notOptimized = (Array.isArray(this.certified) ? this.certified : []).filter(
      device => !device.CertifiedDevice && device.Health !== 'Disabled'
    );
    const degradedGroups = (Array.isArray(this.groups) ? this.groups : [])
      .map(group => {
        const members = (group.Devices ?? []).map(member => byNwkId.get(member._NwkId)).filter(Boolean);
        const lost = members.filter(
          device => device.Health === HEALTH_NOT_REACHABLE || device.Health === HEALTH_NOT_SEEN
        );
        return { group, members, lost };
      })
      .filter(entry => entry.lost.length > 0);
    const firmware = this.firmwareRows();
    const firmwareDevices = [...new Set(firmware.map(fw => fw.nwkid))].map(nwkid => byNwkId.get(nwkid)).filter(Boolean);

    this.figures = this.buildFigures(devices.length, live.length, byNwkId);

    const items: AttentionItem[] = [];
    const devicesItem = (category: string, tone: Tone, title: string, list: any[], detail = this.names(list)) => {
      items.push({
        category,
        tone,
        title,
        detail,
        count: list.length,
        devices: list,
        export: () => of({ category, title, count: list.length, devices: list.map(device => this.deviceRow(device)) })
      });
    };

    if (notReachable.length) {
      devicesItem('not-reachable', 'danger', this.t('dashboard.attention.notreachable'), notReachable);
    }
    if (this.pluginStats.Error) {
      const title = this.t('dashboard.attention.errors');
      items.push({
        category: 'log-errors',
        tone: 'danger',
        title,
        detail: this.t('dashboard.attention.errors.detail'),
        route: '/tools/error',
        export: () =>
          this.apiService.getLogErrorHistory().pipe(
            map(errors => {
              this.headerService.setError(false);
              return { category: 'log-errors', title, errors: errors ?? [] };
            })
          )
      });
    }
    if (lowBattery.length) {
      devicesItem(
        'battery-low',
        'warning',
        this.t('dashboard.attention.battery'),
        lowBattery,
        lowBattery.map(device => (device.ZDeviceName || device._NwkId) + ' ' + device.Battery + ' %').join(', ')
      );
    }
    if (notSeen.length) {
      devicesItem(
        'not-seen',
        'warning',
        this.t('dashboard.attention.notseen', { hours: this.healthTimeOutHours }),
        notSeen
      );
    }
    if (degradedGroups.length) {
      const title = this.t('dashboard.attention.groups');
      const members = [...new Set(degradedGroups.flatMap(entry => entry.members))];
      items.push({
        category: 'groups-degraded',
        tone: 'warning',
        title,
        detail: degradedGroups.map(entry => entry.group.GroupName + ': ' + this.names(entry.lost)).join(' · '),
        count: degradedGroups.length,
        devices: members,
        export: () =>
          of({
            category: 'groups-degraded',
            title,
            count: degradedGroups.length,
            groups: degradedGroups.map(entry => ({
              GroupId: entry.group._GroupId,
              GroupName: entry.group.GroupName,
              members: entry.members.map(device => this.deviceRow(device))
            }))
          })
      });
    }
    if (notOptimized.length) {
      devicesItem(
        'not-optimized',
        'warning',
        this.t('dashboard.attention.notoptimized'),
        notOptimized,
        this.t('dashboard.attention.notoptimized.detail', { names: this.names(notOptimized) })
      );
    }
    if (firmware.length) {
      const title = this.t('dashboard.attention.firmware');
      items.push({
        category: 'firmware-available',
        tone: 'info',
        title,
        detail: this.names(firmwareDevices),
        count: firmware.length,
        devices: firmwareDevices,
        entries: firmware.map(fw => ({
          text: byNwkId.get(fw.nwkid)?.ZDeviceName || fw.zdevicename || fw.nwkid,
          href: this.isUrl(fw.url) ? fw.url : undefined,
          title: this.t(
            this.isUrl(fw.url) ? 'dashboard.attention.firmware.download' : 'dashboard.attention.firmware.nourl',
            {
              newest: fw.newestversion,
              current: fw.currentversion
            }
          )
        })),
        export: () =>
          of({
            category: 'firmware-available',
            title,
            count: firmware.length,
            firmware: firmware.map(fw => ({
              NwkId: fw.nwkid,
              ZDeviceName: fw.zdevicename,
              Model: fw.model,
              Manufacturer: fw.manufacturername,
              FirmwareType: fw.fwtype,
              CurrentVersion: fw.currentversion,
              NewestVersion: fw.newestversion,
              URL: this.isUrl(fw.url) ? fw.url : null
            }))
          })
      });
    }
    this.items = items;
  }

  private buildFigures(total: number, live: number, byNwkId: Map<string, any>): KeyFigure[] {
    const stats = this.pluginStats;
    const acked = stats.APSAck ?? 0;
    // A unicast not acknowledged is counted in APSNck; APSFailure is not incremented by the plugin
    const failed = stats.APSNck ?? 0;
    const delivery = acked + failed > 0 ? (acked * 100) / (acked + failed) : null;

    // One "<nwkid>" / "<progress>" pair per transfer, comma separated when several run at once.
    // Progress is "<n>%" while blocks flow; "Success", "Aborted", "Failed"... stay after the end.
    const otaDevices = String(this.pluginHealth?.OTAupdateDevice ?? '').split(',');
    const otaTransfers = String(this.pluginHealth?.OTAupdateProgress ?? '')
      .split(',')
      .map((progress, index) => ({ progress: progress.trim(), nwkid: (otaDevices[index] ?? '').trim() }))
      .filter(transfer => transfer.progress.endsWith('%'))
      .map(transfer => (byNwkId.get(transfer.nwkid)?.ZDeviceName || transfer.nwkid) + ' ' + transfer.progress);
    const otaRunning = otaTransfers.length > 0;

    const figures: KeyFigure[] = [
      {
        label: this.t('dashboard.kpi.devices'),
        value: live + ' / ' + total,
        detail:
          live === total
            ? this.t('dashboard.kpi.devices.all')
            : this.t('dashboard.kpi.devices.notlive', { count: total - live }),
        tone: live === total ? 'success' : 'warning'
      },
      {
        label: this.t('dashboard.kpi.received'),
        value: this.number(stats.Rxpm),
        detail: this.t('dashboard.kpi.sent', { value: this.number(stats.Txpm) }),
        tone: 'info'
      },
      {
        label: this.t('dashboard.kpi.delivery'),
        value: delivery === null ? '—' : (delivery === 100 ? '100' : delivery.toFixed(1)) + ' %',
        detail:
          delivery === null
            ? this.t('dashboard.kpi.delivery.none')
            : this.t('dashboard.kpi.delivery.detail', { ack: acked, failed }),
        tone: delivery === null ? 'secondary' : delivery >= 98 ? 'success' : delivery >= 90 ? 'warning' : 'danger',
        info: this.t('dashboard.kpi.delivery.info')
      },
      {
        label: this.t('dashboard.kpi.coordinator'),
        value: this.plugin?.CoordinatorModel || '—',
        detail: this.t('dashboard.kpi.coordinator.detail', {
          firmware: this.plugin?.CoordinatorFirmwareVersion || '—',
          channel: this.channel() ?? '—'
        }),
        tone: 'success'
      },
      this.pluginFigure(),
      {
        label: this.t('dashboard.kpi.uptime'),
        value: this.uptime(stats.Uptime),
        detail: this.t('dashboard.kpi.uptime.since', {
          date: this.datePipe.transform(stats.StartTime * 1000, 'dd/MM/yyyy HH:mm')
        }),
        tone: 'secondary'
      }
    ];
    // Only while a transfer runs: available firmware is a "Needs attention" item
    if (otaRunning) {
      figures.push({
        label: this.t('dashboard.kpi.ota'),
        value: this.t('dashboard.kpi.ota.running'),
        detail: otaTransfers.join(', '),
        tone: 'info',
        link: { route: '/admin/firmware', text: this.t('dashboard.kpi.ota.link') }
      });
    }
    return figures;
  }

  /**
   * A release runs from a stable* branch (or from no git checkout at all): its version says it all.
   * Any other branch, or a detached HEAD, is shown with its commit only: the VERSION file there is
   * the one the branch started from, and would mislead.
   */
  private pluginFigure(): KeyFigure {
    const branch = this.plugin?.PluginBranch;
    const version = this.plugin?.PluginVersion || '—';
    const commit = this.plugin?.PluginCommit?.slice(0, SHORT_COMMIT_LENGTH);
    const gitBranch = this.plugin?.PluginCommitBranch;
    const release = !commit || (gitBranch ?? '').startsWith('stable');
    return {
      label: this.t('dashboard.kpi.plugin'),
      value: release ? version : gitBranch || this.t('dashboard.kpi.plugin.detached'),
      detail: release ? gitBranch || branch || '—' : this.t('dashboard.kpi.plugin.commit', { commit }),
      tone: release ? 'secondary' : 'warning'
    };
  }

  private exportHeader() {
    return {
      exported: new Date().toISOString(),
      plugin: this.plugin?.PluginVersion ?? null,
      pluginBranch: this.plugin?.PluginBranch ?? null,
      pluginCommit: this.plugin?.PluginCommit ?? null,
      pluginGitBranch: this.plugin?.PluginCommitBranch ?? null,
      coordinator: {
        model: this.plugin?.CoordinatorModel ?? null,
        firmware: this.plugin?.CoordinatorFirmwareVersion ?? null,
        channel: this.channel()
      }
    };
  }

  /**
   * One row per device and firmware type. The plugin keys OTAUpdate by image type: a number while
   * it runs, a string once reloaded from disk, so after a restart a firmware is listed twice.
   * The later row is the one found since the restart.
   */
  private firmwareRows(): any[] {
    const rows = new Map<string, any>();
    for (const fw of Array.isArray(this.firmwareAvailable) ? this.firmwareAvailable : []) {
      const key = fw.nwkid + '/' + String(fw.fwtype);
      rows.delete(key);
      rows.set(key, fw);
    }
    return [...rows.values()];
  }

  // The plugin sends "N/A" when it has no URL
  private isUrl(value: any): boolean {
    return typeof value === 'string' && /^https?:\/\//.test(value);
  }

  private deviceRow(device: any) {
    return {
      NwkId: device._NwkId,
      IEEE: device.IEEE,
      Model: device.Model,
      ZDeviceName: device.ZDeviceName,
      Status: device.Status,
      Health: device.Health,
      Battery: device.Battery,
      LQI: device.LQI
    };
  }

  private save(fileName: string, doc: object) {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: this.fileSaverService.genType(fileName) });
    this.fileSaverService.save(blob, fileName);
  }

  private names(list: any[]): string {
    const shown = list.slice(0, 3).map(device => device.ZDeviceName || device._NwkId);
    return shown.join(', ') + (list.length > 3 ? ' +' + (list.length - 3) : '');
  }

  // The plugin sends the channel as a number; only its placeholder without a coordinator sends hex ("0b")
  private channel(): number | null {
    const value = this.coordinator?.Channel;
    const channel = typeof value === 'number' ? value : parseInt(value, 16);
    return isNaN(channel) ? null : channel;
  }

  private number(value: number): string {
    return value === undefined || value === null ? '—' : String(Math.round(value * 10) / 10);
  }

  private uptime(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds ?? 0));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) {
      return this.t('dashboard.kpi.uptime.days', { d, h });
    }
    if (h > 0) {
      return this.t('dashboard.kpi.uptime.hours', { h, m });
    }
    return this.t('dashboard.kpi.uptime.minutes', { m });
  }

  private t(key: string, params?: object): string {
    return this.translateService.instant(key, params);
  }
}
