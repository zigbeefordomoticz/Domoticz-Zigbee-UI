import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { VersionService } from '@app/services/version-service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { Group } from '@app/shared/models/group';
import { Plugin } from '@app/shared/models/plugin';
import { Setting } from '@app/shared/models/setting';
import { DeviceDetailsComponent } from '@app/device/device-details/device-details.component';
import { environment } from '@env/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, filter, map, retry, share, switchMap, takeUntil } from 'rxjs/operators';
import { PluginStats, Trend } from '../shared/models/plugin-stats';
import { DeviceListRequest, DeviceListRow, toDeviceListRow } from './device-list';
import { hasIntervalCounts, messagesPerMinute } from './traffic-rate';

interface DeviceSegment {
  label: string;
  color: string;
  devices: any[];
  count: number;
  percent?: number;
}

interface DeviceGroup {
  title: string;
  info: string;
  infoParams: object;
  empty: string;
  total: number;
  segments: DeviceSegment[];
}

// One meaning per colour: green fine, amber attention, red problem, greys unknown / disabled; blues are neutral
const COLORS = {
  good: 'var(--bs-success)',
  goodLight: '#75b798',
  attention: 'var(--bs-warning)',
  problem: 'var(--bs-danger)',
  unknown: '#adb5bd',
  disabled: 'var(--bs-secondary)',
  neutral: 'var(--bs-primary)',
  neutralLight: '#9ec5fe',
  greenPower: 'var(--bs-teal)'
};

/**
 * A Green Power device of /zgp-device-raw as a row of the device lists. It has no
 * /zdevice-name record (no Details window) and no network address of its own:
 * its NWK is the low half of its source ID, which may equal a Zigbee device's.
 */
function toGreenPowerDevice(record: any) {
  const srcId =
    typeof record?.src_id === 'number' ? '0x' + record.src_id.toString(16).toUpperCase().padStart(8, '0') : '';
  return {
    _NwkId: '',
    IEEE: record?.IEEE ?? '',
    Model: record?.Model || ('Green Power ' + srcId).trim(),
    GreenPower: true
  };
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  // The device list window: its title, dot colour and lines, and the search typed in it
  list: { title: string; color: string; rows: DeviceListRow[] } = { title: '', color: '', rows: [] };
  listSearch = '';
  // Above this many lines the window offers a search
  readonly listSearchFrom = 10;
  @ViewChild('deviceList') private deviceList: TemplateRef<unknown>;
  settingsToSave: Array<Setting> = [];
  // Plugin HealthTimeOut, in hours, for the health card's definitions (plugin default 6 h)
  healthTimeOutHours = 6;

  poll = false;
  chart: Chart;
  // The plugin sends per-interval counts: the chart shows messages per minute, else averages since start
  trendRate = false;
  devices: any;
  certified: DeviceByName[];
  routers: any;
  healthsLive: any;
  healthsDisabled: any;
  healthsNotSeen: any;
  healthsNotReachable: any;
  healthsOthers: any = {};
  // Green Power devices (/zgp-device-raw): never polled, so no health status of their own
  greenPower: any[] = [];
  pluginStats: PluginStats;
  devicesOther: any;
  certifiedDevices: any;
  notCertifiedDevices: any;
  battery1: any;
  battery2: any;
  battery3: any;
  battery4: any;
  deviceGroups: DeviceGroup[] = [];
  sinceStart: { label: string; value: string }[] = [];

  getScreenWidth: any;
  getScreenHeight: any;

  plugin: Plugin;
  pluginHealth: any;
  groups: Group[] = [];
  // Loaded once: static, and /ota-firmware-available logs a Status line per device on every call
  coordinator: any;
  firmwareAvailable: any[] = [];

  constructor(
    private apiService: ApiService,
    private versionService: VersionService,
    private headerService: HeaderService,
    private translateService: TranslateService,
    private modalService: NgbModal
  ) {
    super();
  }

  ngOnInit() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;

    this.apiService.getSettings().subscribe(res => {
      res.forEach(setting => {
        this.settingsToSave = this.settingsToSave.concat(setting.ListOfSettings);
      });
      const healthTimeOut = this.settingsToSave.find(setting => setting.Name === 'HealthTimeOut');
      if (healthTimeOut) {
        const seconds = Number(healthTimeOut.current_value ?? healthTimeOut.default_value);
        if (!isNaN(seconds)) {
          this.healthTimeOutHours = Math.round((seconds / 3600) * 10) / 10;
        }
      }
    });

    this.subs.sink = this.headerService.polling.subscribe(poll => {
      this.poll = poll;
      this.subs.add(
        timer(1, environment.refresh)
          .pipe(
            switchMap(() => this.getStats()),
            retry(),
            share(),
            takeUntil(this.headerService.polling.pipe(filter(val => val === false)))
          )
          .subscribe()
      );
    });

    if (!this.poll) {
      this.getStats().subscribe();
    }
    this.apiService.getCoordinator().subscribe(coordinator => (this.coordinator = coordinator));
    this.apiService.getOtaFirmwareAvailable().subscribe(firmware => (this.firmwareAvailable = firmware ?? []));
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

  createChart() {
    const trend = this.pluginStats.Trend ?? [];
    this.trendRate = hasIntervalCounts(trend);
    this.chart = new Chart(this.trendRate ? this.rateChartOptions(trend) : this.averageChartOptions(trend));
    this.subs.add(this.chart.ref$.subscribe());
  }

  private rateChartOptions(trend: Trend[]): any {
    const rates = messagesPerMinute(trend);
    return {
      chart: { type: 'line', height: 200 },
      time: { useUTC: false },
      title: { text: '' },
      credits: { enabled: false },
      legend: { align: 'center', verticalAlign: 'top' },
      // Labels show minutes: a shorter tick interval (a few minutes of data) would repeat them
      xAxis: { type: 'datetime', minTickInterval: 60 * 1000, labels: { format: '{value:%H:%M}' } },
      yAxis: [
        { title: { text: this.translateService.instant('dashboard.trend.yaxis.rate') }, min: 0 },
        {
          title: { text: this.translateService.instant('dashboard.load') },
          min: 0,
          allowDecimals: false,
          opposite: true
        }
      ],
      tooltip: { shared: true, xDateFormat: '%H:%M:%S' },
      plotOptions: { series: { marker: { enabled: false } } },
      series: [
        {
          name: this.translateService.instant('dashboard.since.received'),
          data: rates.map(point => [point.time, point.rx]),
          type: 'line',
          color: '#0d6efd'
        },
        {
          name: this.translateService.instant('dashboard.since.sent'),
          data: rates.map(point => [point.time, point.tx]),
          type: 'line',
          color: '#fd7e14'
        },
        {
          name: this.translateService.instant('dashboard.load'),
          data: rates.map(point => [point.time, point.load]),
          type: 'area',
          step: 'left',
          lineWidth: 0,
          fillOpacity: 0.15,
          zIndex: -1,
          yAxis: 1,
          color: '#6f42c1'
        }
      ]
    };
  }

  // Plugins before #2197: Rxps / Txps are averages since the plugin started
  private averageChartOptions(trend: Trend[]): any {
    const tx: any[] = [];
    const rx: any[] = [];
    const load: any[] = [];

    const sorted = [...trend].sort((t1, t2) => {
      const ts1 = t1._TS;
      const ts2 = t2._TS;
      if (ts1 > ts2) {
        return 1;
      }
      if (ts1 < ts2) {
        return -1;
      }
      return 0;
    });

    let secondsToSubstract = sorted.length * 5;
    sorted.forEach(trend => {
      const dateFin = new Date();
      const datePlot = new Date(dateFin.setSeconds(dateFin.getSeconds() - secondsToSubstract));
      secondsToSubstract = secondsToSubstract - 5;
      tx.push({ x: datePlot, y: trend.Txps });
      rx.push({ x: datePlot, y: trend.Rxps });
      load.push({ x: datePlot, y: trend.Load });
    });

    const chart: any = {
      chart: {
        type: 'line',
        height: '150'
      },
      title: {
        text: ''
      },
      legend: {
        align: 'center',
        verticalAlign: 'top',
        floating: true
      },
      xAxis: {
        allowDecimals: false,
        labels: {
          formatter: function () {
            const date = new Date(this.value);
            return (
              date.getHours() +
              (date.getMinutes() > 9 ? ':' + date.getMinutes() : ':0' + date.getMinutes()) +
              (date.getSeconds() > 9 ? ':' + date.getSeconds() : ':0' + date.getSeconds())
            );
          }
        },
        type: 'datetime'
      },
      yAxis: {
        title: {
          text: ''
        },
        labels: {
          formatter: function () {
            return this.value + '';
          }
        }
      },
      tooltip: {
        pointFormat: '{series.name} <b>{point.y}</b>'
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          label: {
            connectorAllowed: false
          }
        }
      },
      series: [
        {
          name: this.translateService.instant('dashboard.txps'),
          data: tx,
          type: 'line',
          color: 'blue'
        },
        {
          name: this.translateService.instant('dashboard.rxps'),
          data: rx,
          type: 'line',
          color: 'green'
        },
        {
          name: this.translateService.instant('dashboard.load'),
          data: load,
          type: 'line',
          color: 'orange'
        }
      ]
    };

    return chart;
  }

  /** A bar segment or chip: "Plugin devices · Live". */
  showSegment(group: DeviceGroup, segment: DeviceSegment) {
    // Segment labels are lower case ("live"), capitalised by CSS on the chips
    const label = String(this.translateService.instant(segment.label)).trim();
    const title = this.translateService.instant(group.title) + ' · ' + label.charAt(0).toUpperCase() + label.slice(1);
    this.showDevices({ title, color: segment.color, devices: segment.devices });
  }

  /** Lists the devices, sorted by name; the Details window needs the /zdevice-name record. */
  showDevices(request: DeviceListRequest) {
    const byNwkId = new Map((this.certified ?? []).map(device => [device._NwkId, device]));
    const rows = (request.devices ?? []).map(device => toDeviceListRow(device, byNwkId.get(device._NwkId) ?? null));
    rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }));
    this.list = { title: request.title, color: request.color, rows };
    this.listSearch = '';
    this.modalService.open(this.deviceList, { scrollable: true, ariaLabelledBy: 'dashboard-list-title' }).result.then(
      (): void => undefined,
      (): void => undefined
    );
  }

  listRows(): DeviceListRow[] {
    const search = this.listSearch.trim().toLowerCase();
    return search ? this.list.rows.filter(row => row.search.includes(search)) : this.list.rows;
  }

  /** Opens on top of the list: closing the Details window goes back to it. */
  openDetails(row: DeviceListRow) {
    const details = this.modalService.open(DeviceDetailsComponent, {
      size: 'lg',
      scrollable: true,
      ariaLabelledBy: 'device-details-title'
    });
    details.componentInstance.device = row.details;
    details.componentInstance.healthTone = row.tone;
    details.componentInstance.actions = false;
    details.result.then(
      (): void => undefined,
      (): void => undefined
    );
  }

  refresh() {
    this.getStats().subscribe();
    this.versionService.setReload(true);
  }

  private buildDeviceGroups() {
    const segment = (label: string, color: string, devices: any[]): DeviceSegment => ({
      label,
      color,
      devices,
      count: devices.length
    });
    const group = (
      title: string,
      info: string,
      segments: DeviceSegment[],
      empty = '',
      infoParams: object = {}
    ): DeviceGroup => {
      const total = segments.reduce((sum, s) => sum + s.count, 0);
      segments.forEach(s => (s.percent = total ? Math.round((s.count * 100) / total) : 0));
      return { title, info, infoParams, empty, total, segments };
    };

    this.deviceGroups = [
      group(
        'dashboard.health.title',
        'dashboard.health.comment',
        [
          segment('dashboard.devices.live', COLORS.good, this.healthsLive),
          segment('dashboard.devices.notseen', COLORS.attention, this.healthsNotSeen),
          segment('dashboard.devices.notReachable', COLORS.problem, this.healthsNotReachable),
          segment('dashboard.devices.others', COLORS.unknown, this.healthsOthers),
          segment('dashboard.devices.disabled', COLORS.disabled, this.healthsDisabled),
          segment('dashboard.devices.greenpower', COLORS.greenPower, this.greenPower)
        ],
        '',
        { hours: this.healthTimeOutHours }
      ),
      group('dashboard.device.title', 'dashboard.devices.comment', [
        segment('dashboard.devices.routers', COLORS.neutral, this.routers),
        segment('dashboard.devices.enddevice', COLORS.neutralLight, this.devicesOther),
        segment('dashboard.devices.greenpower', COLORS.greenPower, this.greenPower)
      ]),
      group(
        'dashboard.battery.title',
        'dashboard.battery.comment',
        [
          segment('dashboard.devices.battery.inf.15', COLORS.problem, this.battery1),
          segment('dashboard.devices.battery.inf.35', COLORS.attention, this.battery2),
          segment('dashboard.devices.battery.inf.75', COLORS.goodLight, this.battery3),
          segment('dashboard.devices.battery.sup.75', COLORS.good, this.battery4)
        ],
        'dashboard.battery.none'
      ),
      group('dashboard.optimized.title', 'dashboard.optimized.comment', [
        segment('dashboard.devices.optimized', COLORS.good, this.certifiedDevices),
        segment('dashboard.devices.not.optimized', COLORS.attention, this.notCertifiedDevices)
      ])
    ];
  }

  private buildSinceStart() {
    const stats = this.pluginStats;
    const format = (value: number) => (value ?? 0).toLocaleString(this.translateService.currentLang);
    this.sinceStart = [
      { label: 'dashboard.since.received', value: format(stats.Received) },
      { label: 'dashboard.since.sent', value: format(stats.Sent) },
      { label: 'dashboard.since.retx', value: format(stats.ReTx) },
      { label: 'dashboard.since.apsfailure', value: format(stats.APSNck) },
      { label: 'dashboard.since.maxload', value: format(stats.MaxLoad) }
    ];
  }

  private getStats() {
    return forkJoin([
      this.apiService.getPluginStats(),
      this.apiService.getZDevices(),
      this.apiService.getPlugin(),
      this.apiService.getZDeviceName(),
      this.apiService.getPluginhealth(),
      this.apiService.getZGroups(),
      // A plugin without Green Power has no such route: the dashboard goes on without them
      this.apiService.getRawZgpDevices().pipe(catchError(() => of([])))
    ]).pipe(
      map(([pluginStats, devices, plugin, certified, pluginHealth, groups, greenPower]) => {
        this.plugin = plugin;
        this.pluginHealth = pluginHealth;
        this.groups = Array.isArray(groups) ? groups : [];
        this.pluginStats = pluginStats;
        this.devices = devices ? devices : [];
        this.certified = certified ? certified : [];
        this.greenPower = (Array.isArray(greenPower) ? greenPower : []).map(toGreenPowerDevice);
        // While the radio starts, the plugin answers without a channel: ask again until it has one
        if (this.coordinator && this.coordinator.Channel == null) {
          this.apiService.getCoordinator().subscribe(coordinator => (this.coordinator = coordinator));
        }
        this.createChart();

        this.routers = this.devices.filter(
          (router: any) => router.LogicalType === 'Router' && router.Health !== 'Disabled'
        );
        this.devicesOther = this.devices.filter(
          (router: any) => router.LogicalType !== 'Router' && router.Health !== 'Disabled'
        );

        this.healthsLive = this.devices.filter((device: any) => device.Health === 'Live' && device.Status !== 'notDB');
        this.healthsDisabled = this.devices.filter(
          (device: any) => device.Health === 'Disabled' || device.Status === 'notDB'
        );
        this.healthsNotReachable = this.devices.filter((device: any) => {
          return (device.Health === 'Not Reachable' && device.Status !== 'notDB') || device.Status === 'Leave';
        });
        this.healthsNotSeen = this.devices.filter((device: any) => {
          return device.Health === 'Not seen last 24hours' && device.Status !== 'notDB';
        });
        this.healthsOthers = this.devices.filter((device: any) => {
          return (
            device.Health !== 'Not seen last 24hours' &&
            device.Health !== 'Not Reachable' &&
            device.Health !== 'Live' &&
            device.Status !== 'notDB' &&
            device.Status !== 'Leave' &&
            device.Health !== 'Disabled'
          );
        });

        // A battery device that has not reported yet has Battery "": that is no level, not "< 15 %"
        const devicesOnBattery = this.devices.filter(
          (device: any) =>
            device.PowerSource === 'Battery' &&
            device.Status !== 'notDB' &&
            device.Battery !== '' &&
            device.Battery !== null &&
            device.Battery !== undefined
        );
        this.battery1 = devicesOnBattery.filter((device: any) => device.Battery <= 15 && device.Health !== 'Disabled');
        this.battery2 = devicesOnBattery.filter(
          (device: any) => device.Battery > 15 && device.Battery <= 35 && device.Health !== 'Disabled'
        );
        this.battery3 = devicesOnBattery.filter(
          (device: any) => device.Battery > 35 && device.Battery <= 75 && device.Health !== 'Disabled'
        );
        this.battery4 = devicesOnBattery.filter((device: any) => device.Battery > 75 && device.Health !== 'Disabled');

        this.certifiedDevices = this.certified.filter(
          (device: any) => device.CertifiedDevice && device.Health !== 'Disabled'
        );
        this.notCertifiedDevices = this.certified.filter(
          (device: any) => !device.CertifiedDevice && device.Health !== 'Disabled'
        );

        this.buildDeviceGroups();
        this.buildSinceStart();
        this.headerService.setError(pluginStats.Error);
      })
    );
  }
}
