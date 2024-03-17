import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { VersionService } from '@app/services/version-service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { Plugin } from '@app/shared/models/plugin';
import { Setting } from '@app/shared/models/setting';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import { MatomoTracker } from 'ngx-matomo-client';
import { OverlayPanel } from 'primeng/overlaypanel';
import { forkJoin, timer } from 'rxjs';
import { filter, map, retry, share, switchMap, takeUntil } from 'rxjs/operators';
import { PluginStats } from '../shared/models/plugin-stats';

const log = new Logger('DashboardComponent');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  @ViewChild('op') overlay: OverlayPanel;

  settingsToSave: Array<Setting> = [];
  showConsent = false;

  poll = false;
  chart: Chart;
  devices: any;
  certified: DeviceByName[];
  routers: any;
  inDbs: any;
  healthsLive: any;
  healthsDisabled: any;
  healthsNotSeen: any;
  healthsNotReachable: any;
  healthsOthers: any = {};
  pluginStats: PluginStats;
  maxLoad: any = {};
  currentLoad: any = {};
  devicesOther: any;
  certifiedDevices: any;
  notCertifiedDevices: any;
  devicesToOverlay: any[];
  widthOverlay: number;
  battery1: any;
  battery2: any;
  battery3: any;
  battery4: any;

  advancedPieLoad: any;
  advancedPieSent: any;
  advancedPieDevice: any;
  advancedPieState: any[] = [];
  advancedPieBattery: any;
  advancedPieCertified: any;
  advancedPieLoadLabel: string;
  advancedPieSentLabel: string;
  advancedPieDeviceLabel: string;
  advancedPieStateLabel: string;
  advancedPieBatteryLabel: string;
  advancedCertifiedLabel: string;

  getScreenWidth: any;
  getScreenHeight: any;

  gaugeType = 'full';
  gaugeAppendText = '';

  thick = 15;

  animations = true;
  gradient = false;
  tooltipDisabled = false;
  colorShemeState: {
    domain: string[];
  };
  colorSchemeROBG = {
    domain: ['red', 'orange', 'green', 'blue']
  };
  colorSchemeGBROG = {
    domain: ['green', 'blue', 'red', 'orange', 'gray']
  };
  colorSchemeBG = {
    domain: ['blue', 'green']
  };
  colorSchemePC = {
    domain: ['purple', 'cyan']
  };
  colorSchemeGO = {
    domain: ['green', 'orange']
  };

  plugin: Plugin;

  constructor(
    private apiService: ApiService,
    private versionService: VersionService,
    private headerService: HeaderService,
    private translateService: TranslateService,
    private readonly tracker: MatomoTracker
  ) {
    super();
  }

  ngOnInit() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;

    this.apiService.getSettings().subscribe(res => {
      res.forEach(setting => {
        this.settingsToSave = this.settingsToSave.concat(setting.ListOfSettings);
        this.settingsToSave.forEach(setting => {
          const name = setting.Name;
          if (name === 'PluginAnalytics') {
            if (setting.current_value === -1) {
              this.showConsent = true;
            } else {
              if (setting.current_value === 1) {
                this.tracker.setConsentGiven();
                this.tracker.rememberConsentGiven();
              } else {
                this.tracker.forgetConsentGiven();
              }
            }
          }
        });
      });
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
    this.getInfos();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

  getInfos() {
    this.advancedPieLoadLabel = this.translateService.instant('dashboard.trafic.maxload.label');
    this.advancedPieSentLabel = this.translateService.instant('dashboard.trafic.label');
    this.advancedPieDeviceLabel = this.translateService.instant('dashboard.devices.label');
    this.advancedPieStateLabel = this.translateService.instant('dashboard.devices.state.label');
    this.advancedPieBatteryLabel = this.translateService.instant('dashboard.devices.battery.label');
    this.advancedCertifiedLabel = this.translateService.instant('dashboard.devices.optimized.label');
  }

  percentageFormatting(value: any) {
    return Math.round(value);
  }

  createChart() {
    const tx: any[] = [];
    const rx: any[] = [];
    const load: any[] = [];

    const sorted = this.pluginStats.Trend.sort((t1, t2) => {
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

    this.chart = new Chart(chart);

    this.subs.add(this.chart.ref$.subscribe());
  }

  open(name: string, event: any) {
    if (name === 'device') {
      if (event.name === this.translateService.instant('dashboard.devices.routers')) {
        this.devicesToOverlay = this.routers;
      } else {
        this.devicesToOverlay = this.devicesOther;
      }
    } else if (name === 'state') {
      if (event.name === this.translateService.instant('dashboard.devices.live')) {
        this.devicesToOverlay = this.healthsLive;
      } else if (event.name === this.translateService.instant('dashboard.devices.disabled')) {
        this.devicesToOverlay = this.healthsDisabled;
      } else if (event.name === this.translateService.instant('dashboard.devices.others')) {
        this.devicesToOverlay = this.healthsOthers;
      } else if (event.name === this.translateService.instant('dashboard.devices.notReachable')) {
        this.devicesToOverlay = this.healthsNotReachable;
      } else {
        this.devicesToOverlay = this.healthsNotSeen;
      }
    } else if (name === 'battery') {
      if (event.name === this.translateService.instant('dashboard.devices.battery.inf.15')) {
        this.devicesToOverlay = this.battery1;
      } else if (event.name === this.translateService.instant('dashboard.devices.battery.inf.35')) {
        this.devicesToOverlay = this.battery2;
      } else if (event.name === this.translateService.instant('dashboard.devices.battery.inf.75')) {
        this.devicesToOverlay = this.battery3;
      } else {
        this.devicesToOverlay = this.battery4;
      }
    } else if (name === 'certified') {
      if (event.name === this.translateService.instant('dashboard.devices.optimized')) {
        this.devicesToOverlay = this.certifiedDevices;
      } else {
        this.devicesToOverlay = this.notCertifiedDevices;
      }
    }

    const width = (this.getScreenWidth * 80) / 100;
    if (width > 768) {
      this.widthOverlay = width;
      this.overlay.toggle(null);
    }
  }

  refresh() {
    this.getStats().subscribe();
    this.versionService.setReload(true);
  }

  private getStats() {
    return forkJoin([
      this.apiService.getPluginStats(),
      this.apiService.getZDevices(),
      this.apiService.getPlugin(),
      this.apiService.getZDeviceName()
    ]).pipe(
      map(([pluginStats, devices, plugin, certified]) => {
        this.plugin = plugin;
        this.pluginStats = pluginStats;
        this.devices = devices ? devices : [];
        this.certified = certified ? certified : [];
        this.trackEvent();
        this.createChart();
        this.maxLoad.label = this.translateService.instant('dashboard.trafic.maxload');
        this.maxLoad.total = pluginStats.MaxLoad;
        this.currentLoad.label = this.translateService.instant('dashboard.trafic.currentload');
        this.currentLoad.total = pluginStats.CurrentLoad;
        this.advancedPieLoad = [
          {
            name: this.translateService.instant('dashboard.trafic.maxload'),
            value: pluginStats.MaxLoad - pluginStats.CurrentLoad
          },
          { name: this.translateService.instant('dashboard.trafic.currentload'), value: pluginStats.CurrentLoad }
        ];
        this.advancedPieSent = [
          { name: this.translateService.instant('dashboard.trafic.send'), value: pluginStats.Sent },
          { name: this.translateService.instant('dashboard.trafic.receive'), value: pluginStats.Received }
        ];

        this.devices.total = this.devices.length;
        this.devices.label = this.translateService.instant('devices');
        this.routers = this.devices.filter(
          (router: any) => router.LogicalType === 'Router' && router.Health !== 'Disabled'
        );
        this.devicesOther = this.devices.filter(
          (router: any) => router.LogicalType !== 'Router' && router.Health !== 'Disabled'
        );
        this.routers.label = this.translateService.instant('dashboard.devices.routers');
        this.routers.total = ((this.routers.length / this.devices.total) * 100).toFixed(0);
        this.routers.append = '%';

        this.inDbs = this.devices.filter((router: any) => router.Status === 'inDB');
        this.inDbs.label = this.translateService.instant('dashboard.devices.indb');
        this.inDbs.total = ((this.inDbs.length / this.devices.total) * 100).toFixed(0);
        this.inDbs.append = '%';

        this.advancedPieDevice = [
          {
            name: this.translateService.instant('dashboard.devices.routers'),
            value: this.routers.length
          },
          {
            name: this.translateService.instant('dashboard.devices.enddevice'),
            value: this.devicesOther.length
          }
        ];

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

        this.colorShemeState = this.colorSchemeGBROG;

        this.advancedPieState = [];
        this.advancedPieState.push({
          name: this.translateService.instant('dashboard.devices.live'),
          value: this.healthsLive.length
        });

        if (this.healthsDisabled.length > 0) {
          this.advancedPieState.push({
            name: this.translateService.instant('dashboard.devices.disabled'),
            value: this.healthsDisabled.length
          });
        } else {
          this.colorShemeState.domain = this.colorShemeState.domain.filter(color => color !== 'blue');
        }
        if (this.healthsNotReachable.length > 0) {
          this.advancedPieState.push({
            name: this.translateService.instant('dashboard.devices.notReachable'),
            value: this.healthsNotReachable.length
          });
        } else {
          this.colorShemeState.domain = this.colorShemeState.domain.filter(color => color !== 'red');
        }
        this.advancedPieState.push({
          name: this.translateService.instant('dashboard.devices.notseen'),
          value: this.healthsNotSeen.length
        });
        this.advancedPieState.push({
          name: this.translateService.instant('dashboard.devices.others'),
          value: this.healthsOthers.length
        });

        const devicesOnBattery = this.devices.filter(
          (device: any) => device.PowerSource === 'Battery' && device.Status !== 'notDB'
        );
        this.battery1 = devicesOnBattery.filter((device: any) => device.Battery <= 15 && device.Health !== 'Disabled');
        this.battery2 = devicesOnBattery.filter(
          (device: any) => device.Battery > 15 && device.Battery <= 35 && device.Health !== 'Disabled'
        );
        this.battery3 = devicesOnBattery.filter(
          (device: any) => device.Battery > 35 && device.Battery <= 75 && device.Health !== 'Disabled'
        );
        this.battery4 = devicesOnBattery.filter((device: any) => device.Battery > 75 && device.Health !== 'Disabled');
        this.advancedPieBattery = [
          {
            name: this.translateService.instant('dashboard.devices.battery.inf.15'),
            value: this.battery1.length
          },
          {
            name: this.translateService.instant('dashboard.devices.battery.inf.35'),
            value: this.battery2.length
          },
          {
            name: this.translateService.instant('dashboard.devices.battery.inf.75'),
            value: this.battery3.length
          },
          {
            name: this.translateService.instant('dashboard.devices.battery.sup.75'),
            value: this.battery4.length
          }
        ];

        this.certifiedDevices = this.certified.filter(
          (device: any) => device.CertifiedDevice && device.Health !== 'Disabled'
        );
        this.notCertifiedDevices = this.certified.filter(
          (device: any) => !device.CertifiedDevice && device.Health !== 'Disabled'
        );
        this.advancedPieCertified = [
          {
            name: this.translateService.instant('dashboard.devices.optimized'),
            value: this.certifiedDevices.length
          },
          {
            name: this.translateService.instant('dashboard.devices.not.optimized'),
            value: this.notCertifiedDevices.length
          }
        ];

        this.headerService.setError(pluginStats.Error);
      })
    );
  }

  consent(consent: boolean): void {
    const settingsToSend: any = {};
    this.settingsToSave.forEach(setting => {
      const name = setting.Name;
      if (name === 'PluginAnalytics') {
        settingsToSend[name] = { current: consent ? 1 : 0 };
      }
    });
    this.apiService.putSettings(settingsToSend).subscribe(() => {
      this.showConsent = false;
      if (consent) {
        this.tracker.setConsentGiven();
        this.tracker.rememberConsentGiven();
      } else {
        this.tracker.forgetConsentGiven();
      }
    });
  }

  private trackEvent(): void {
    const first = JSON.parse(sessionStorage.getItem('pluginFirstSendToMatomo')) as Plugin;
    if (!first || first.NetworkSize !== this.plugin.NetworkSize) {
      sessionStorage.setItem('pluginFirstSendToMatomo', JSON.stringify(this.plugin));
    }

    if (sessionStorage.getItem('pluginFirstSendToMatomo') !== sessionStorage.getItem('pluginSentToMatomo')) {
      sessionStorage.setItem('pluginSentToMatomo', JSON.stringify(this.plugin));
      this.tracker.setUserId(this.plugin.CoordinatorIEEE);
      this.tracker.setCustomVariable(1, 'CoordinatorModel', this.plugin.CoordinatorModel, 'visit');
      this.tracker.setCustomVariable(2, 'PluginVersion', this.plugin.PluginVersion, 'visit');
      this.tracker.setCustomVariable(3, 'CoordinatorFirmwareVersion', this.plugin.CoordinatorFirmwareVersion, 'visit');
      this.tracker.setCustomVariable(4, 'NetworkSize', this.plugin.NetworkSize, 'visit');
      Object.entries(this.plugin.NetworkDevices).forEach(([code, valueCode]) => {
        Object.entries(valueCode).forEach(([name, valueName]) => {
          this.tracker.trackEvent('NetworkDevices', (valueName as string[]).join('|'), code.concat('|').concat(name));
        });
      });
    }
  }
}
