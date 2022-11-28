import { Component, OnDestroy, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { VersionService } from '@app/services/version-service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { Plugin } from '@app/shared/models/plugin';
import { Setting } from '@app/shared/models/setting';
import { environment } from '@env/environment';
import { MatomoTracker } from '@ngx-matomo/tracker';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import { forkJoin, timer } from 'rxjs';
import { filter, map, retry, share, switchMap, takeUntil } from 'rxjs/operators';
import { GlobalPosition, InsidePlacement, Toppy, ToppyControl } from 'toppy';
import { PluginStats } from '../shared/models/plugin-stats';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';

const log = new Logger('DashboardComponent');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnDestroy {
  settingsToSave: Array<Setting> = [];
  showConsent = false;

  poll = false;
  chart: Chart;
  devices: any;
  routers: any;
  inDbs: any;
  healthsLive: any;
  healthsNotSeen: any;
  healthsNotReachable: any;
  healthsOthers: any = {};
  pluginStats: PluginStats;
  maxLoad: any = {};
  currentLoad: any = {};
  devicesOnBattery: any;
  devicesOther: any;
  batterySup50: any;
  batterySup30: any;
  batteryInf30: any;
  certifiedDevices: any;
  notCertifiedDevices: any;

  advancedPieLoad: any;
  advancedPieSent: any;
  advancedPieDevice: any;
  advancedPieState: any;
  advancedPieBattery: any;
  advancedPieCertified: any;
  advancedPieLoadLabel: string;
  advancedPieSentLabel: string;
  advancedPieDeviceLabel: string;
  advancedPieStateLabel: string;
  advancedPieBatteryLabel: string;
  advancedCertifiedLabel: string;

  gaugeType = 'full';
  gaugeAppendText = '';

  thick = 15;
  toppyControl: ToppyControl;

  animations = true;
  gradient = false;
  tooltipDisabled = false;
  colorSchemeROG = {
    domain: ['red', 'orange', 'green']
  };
  colorSchemeGROG = {
    domain: ['green', 'red', 'orange', 'gray']
  };
  colorSchemeGOR = {
    domain: ['green', 'blue', 'red']
  };
  colorSchemeGC = {
    domain: ['green', 'cyan']
  };
  colorSchemeGR = {
    domain: ['green', 'red']
  };
  colorSchemeGO = {
    domain: ['green', 'orange']
  };

  plugin: Plugin;

  constructor(
    private apiService: ApiService,
    private toppy: Toppy,
    private versionService: VersionService,
    private headerService: HeaderService,
    private translateService: TranslateService,
    private readonly tracker: MatomoTracker
  ) {
    super();
  }

  ngOnInit() {
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

  getInfos() {
    this.advancedPieLoadLabel = this.translateService.instant('dashboard.trafic.maxload.label');
    this.advancedPieSentLabel = this.translateService.instant('dashboard.trafic.label');
    this.advancedPieDeviceLabel = this.translateService.instant('dashboard.devices.label');
    this.advancedPieStateLabel = this.translateService.instant('dashboard.devices.state.label');
    this.advancedPieBatteryLabel = this.translateService.instant('dashboard.devices.battery.label');
    this.advancedCertifiedLabel = this.translateService.instant('dashboard.devices.certified.label');
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
    let devices;
    if (name === 'device') {
      if (event.name === this.translateService.instant('dashboard.devices.routers')) {
        devices = this.routers;
      } else {
        devices = this.devicesOther;
      }
    } else if (name === 'state') {
      if (event.name === this.translateService.instant('dashboard.devices.live')) {
        devices = this.healthsLive;
      } else if (event.name === this.translateService.instant('dashboard.devices.others')) {
        devices = this.healthsOthers;
      } else if (event.name === this.translateService.instant('dashboard.devices.notReachable')) {
        devices = this.healthsNotReachable;
      } else {
        devices = this.healthsNotSeen;
      }
    } else if (name === 'battery') {
      if (event.name === this.translateService.instant('dashboard.devices.battery.inf.30')) {
        devices = this.batteryInf30;
      } else if (event.name === this.translateService.instant('dashboard.devices.battery.sup.30')) {
        devices = this.batterySup30;
      } else {
        devices = this.batterySup50;
      }
    } else if (name === 'certified') {
      if (event.name === this.translateService.instant('dashboard.devices.certified')) {
        devices = this.certifiedDevices;
      } else {
        devices = this.notCertifiedDevices;
      }
    }

    this.toppyControl = this.toppy
      .position(
        new GlobalPosition({
          placement: InsidePlacement.BOTTOM,
          width: '80%',
          height: 'auto'
        })
      )
      .config({
        closeOnDocClick: false,
        closeOnEsc: true
      })
      .content(DeviceByNameComponent, { devices: devices })
      .create();

    this.subs.add(this.toppyControl.listen('t_compins').subscribe(comp => {}));

    this.toppyControl.open();
  }

  close() {
    if (this.toppyControl) {
      this.toppyControl.close();
    }
  }

  refresh() {
    this.getStats().subscribe();
    this.versionService.setReload(true);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.close();
  }

  private getStats() {
    return forkJoin([
      this.apiService.getPluginStats(),
      this.apiService.getZDevices(),
      this.apiService.getPlugin(),
      this.apiService.getZDeviceName()
    ]).pipe(
      map(([res, devices, plugin, certified]) => {
        this.plugin = plugin;
        this.pluginStats = res;
        this.devices = devices;
        this.trackEvent();
        this.createChart();
        this.maxLoad.label = this.translateService.instant('dashboard.trafic.maxload');
        this.maxLoad.total = res.MaxLoad;
        this.currentLoad.label = this.translateService.instant('dashboard.trafic.currentload');
        this.currentLoad.total = res.CurrentLoad;
        this.advancedPieLoad = [
          { name: this.translateService.instant('dashboard.trafic.maxload'), value: res.MaxLoad - res.CurrentLoad },
          { name: this.translateService.instant('dashboard.trafic.currentload'), value: res.CurrentLoad }
        ];
        this.advancedPieSent = [
          { name: this.translateService.instant('dashboard.trafic.send'), value: res.Sent },
          { name: this.translateService.instant('dashboard.trafic.receive'), value: res.Received }
        ];

        this.devices.total = this.devices.length;
        this.devices.label = this.translateService.instant('devices');
        this.routers = this.devices.filter((router: any) => router.LogicalType === 'Router');
        this.devicesOther = this.devices.filter((router: any) => router.LogicalType !== 'Router');
        this.routers.label = this.translateService.instant('dashboard.devices.routers');
        this.routers.total = ((this.routers.length / this.devices.total) * 100).toFixed(0);
        this.routers.append = '%';

        this.inDbs = this.devices.filter((router: any) => router.Status === 'inDB');
        this.inDbs.label = this.translateService.instant('dashboard.devices.indb');
        this.inDbs.total = ((this.inDbs.length / this.devices.total) * 100).toFixed(0);
        this.inDbs.append = '%';
        this.healthsLive = this.devices.filter((device: any) => device.Health === 'Live' && device.Status !== 'notDB');
        this.healthsNotReachable = this.devices.filter((device: any) => {
          return device.Health === 'Not Reachable' && device.Status !== 'notDB';
        });
        this.healthsNotSeen = this.devices.filter((device: any) => {
          return device.Health === 'Not seen last 24hours' && device.Status !== 'notDB';
        });
        this.healthsOthers = this.devices.filter((device: any) => {
          return (
            device.Health !== 'Not seen last 24hours' &&
            device.Health !== 'Not Reachable' &&
            device.Health !== 'Live' &&
            device.Status !== 'notDB'
          );
        });
        this.advancedPieDevice = [
          {
            name: this.translateService.instant('dashboard.devices.routers'),
            value: this.routers.length
          },
          {
            name: this.translateService.instant('dashboard.devices.enddevice'),
            value: this.devices.length - this.routers.length
          }
        ];
        this.advancedPieState = [
          {
            name: this.translateService.instant('dashboard.devices.live'),
            value: this.healthsLive.length
          },
          {
            name: this.translateService.instant('dashboard.devices.notReachable'),
            value: this.healthsNotReachable.length
          },
          {
            name: this.translateService.instant('dashboard.devices.notseen'),
            value: this.healthsNotSeen.length
          },
          { name: this.translateService.instant('dashboard.devices.others'), value: this.healthsOthers.length }
        ];

        this.devicesOnBattery = devices.filter(
          (device: any) => device.PowerSource === 'Battery' && device.Status !== 'notDB'
        );
        const _batteryInf30 = this.devicesOnBattery.filter((device: any) => device.Battery <= 30);
        const _batterySup30 = this.devicesOnBattery.filter(
          (device: any) => device.Battery > 30 && device.Battery <= 50
        );
        const _batterySup50 = this.devicesOnBattery.filter((device: any) => device.Battery > 50);
        this.batteryInf30 = this.devices.filter((it: any) => _batteryInf30.find((iter: any) => iter.IEEE === it.IEEE));
        this.batterySup50 = this.devices.filter((it: any) => _batterySup50.find((iter: any) => iter.IEEE === it.IEEE));
        this.batterySup30 = this.devices.filter((it: any) => _batterySup30.find((iter: any) => iter.IEEE === it.IEEE));
        this.advancedPieBattery = [
          {
            name: this.translateService.instant('dashboard.devices.battery.inf.30'),
            value: this.batteryInf30.length
          },
          {
            name: this.translateService.instant('dashboard.devices.battery.sup.30'),
            value: this.batterySup30.length
          },
          { name: this.translateService.instant('dashboard.devices.battery.sup.50'), value: this.batterySup50.length }
        ];

        this.certifiedDevices = certified.filter((device: any) => device.CertifiedDevice);
        this.notCertifiedDevices = certified.filter((device: any) => !device.CertifiedDevice);
        this.advancedPieCertified = [
          {
            name: this.translateService.instant('dashboard.devices.certified'),
            value: this.certifiedDevices.length
          },
          {
            name: this.translateService.instant('dashboard.devices.not.certified'),
            value: this.notCertifiedDevices.length
          }
        ];

        this.headerService.setError(res.Error);
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
