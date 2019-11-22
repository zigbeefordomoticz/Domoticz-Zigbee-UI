import { Component, OnInit, OnDestroy } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { GlobalPosition, InsidePlacement, Toppy, ToppyControl } from 'toppy';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';
import { Observable } from 'rxjs';
import { Plugin } from '@app/shared/models/plugin';
import { VersionService } from '@app/services/version-service';

const log = new Logger('DashboardComponent');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  devices: any;
  routers: any;
  inDbs: any;
  healthsLive: any;
  healthsNotSeen: any;
  healthsOthers: any = {};
  pluginStats: any;
  totalTraficSent: any = {};
  totalTraficRetx: any = {};
  totalTraficReceived: any = {};
  totalTraficCluster: any = {};
  totalTraficCrc: any = {};
  maxLoad: any = {};
  currentLoad: any = {};
  devicesOnBattery: any;
  batterySup50: any;
  batterySup30: any;
  batteryInf30: any;

  advancedPieLoad: any;
  advancedPieSent: any;
  advancedPieReceived: any;
  advancedPieDevice: any;
  advancedPieState: any;
  advancedPieBattery: any;
  advancedPieLoadLabel: string;
  advancedPieSentLabel: string;
  advancedPieReceivedLabel: string;
  advancedPieDeviceLabel: string;
  advancedPieStateLabel: string;
  advancedPieBatteryLabel: string;

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
  colorSchemeGRO = {
    domain: ['green', 'red', 'orange']
  };
  colorSchemeGOR = {
    domain: ['green', 'blue', 'red']
  };
  colorSchemeGO = {
    domain: ['green', 'cyan']
  };
  colorSchemeGR = {
    domain: ['green', 'red']
  };

  constructor(
    private apiService: ApiService,
    private translate: TranslateService,
    private toppy: Toppy,
    private versionService: VersionService
  ) {}

  ngOnInit() {
    this.getInfos();
  }

  getInfos() {
    this.apiService.getPluginStats().subscribe(res => {
      this.pluginStats = res;
      this.totalTraficSent.label = this.translate.instant('dashboard.trafic.total.trafic.sent');
      this.totalTraficSent.total = res.Sent;
      this.totalTraficRetx.label = this.translate.instant('dashboard.trafic.retx');
      this.totalTraficRetx.total = ((res.ReTx / res.Sent) * 100).toFixed(0);
      this.totalTraficRetx.append = '%';
      this.totalTraficReceived.label = this.translate.instant('dashboard.trafic.total.trafic.received');
      this.totalTraficReceived.total = res.Received;
      this.totalTraficCluster.label = this.translate.instant('dashboard.trafic.cluster');
      this.totalTraficCluster.total = ((res.Cluster / res.Received) * 100).toFixed(0);
      this.totalTraficCluster.append = '%';
      this.totalTraficCrc.label = this.translate.instant('dashboard.trafic.crc');
      this.totalTraficCrc.total = ((res.CRC / res.Received) * 100).toFixed(0);
      this.totalTraficCrc.append = '%';
      this.maxLoad.label = this.translate.instant('dashboard.trafic.maxload');
      this.maxLoad.total = res.MaxLoad;
      this.currentLoad.label = this.translate.instant('dashboard.trafic.currentload');
      this.currentLoad.total = res.CurrentLoad;
      this.advancedPieLoad = [
        { name: this.translate.instant('dashboard.trafic.maxload'), value: res.MaxLoad - res.CurrentLoad },
        { name: this.translate.instant('dashboard.trafic.currentload'), value: res.CurrentLoad }
      ];
      this.advancedPieSent = [
        { name: this.translate.instant('dashboard.trafic.total.trafic.sent'), value: res.Sent - res.ReTx },
        { name: this.translate.instant('dashboard.trafic.retx'), value: res.ReTx }
      ];
      this.advancedPieReceived = [
        {
          name: this.translate.instant('dashboard.trafic.total.trafic.received'),
          value: res.Received - res.Cluster - res.CRC
        },
        { name: this.translate.instant('dashboard.trafic.cluster'), value: res.Cluster },
        { name: this.translate.instant('dashboard.trafic.crc'), value: res.CRC }
      ];
    });

    this.apiService.getZDevices().subscribe(devices => {
      this.devices = devices;
      this.devices.total = this.devices.length;
      this.devices.label = this.translate.instant('devices');
      this.routers = this.devices.filter((router: any) => router.LogicalType === 'Router');
      this.routers.label = this.translate.instant('dashboard.devices.routers');
      this.routers.total = ((this.routers.length / this.devices.total) * 100).toFixed(0);
      this.routers.append = '%';
      this.inDbs = this.devices.filter((router: any) => router.Status === 'inDB');
      this.inDbs.label = this.translate.instant('dashboard.devices.indb');
      this.inDbs.total = ((this.inDbs.length / this.devices.total) * 100).toFixed(0);
      this.inDbs.append = '%';
      this.healthsLive = this.devices.filter((device: any) => device.Health === 'Live');
      this.healthsLive.label = this.translate.instant('dashboard.devices.live');
      this.healthsLive.total = ((this.healthsLive.length / this.devices.total) * 100).toFixed(0);
      this.healthsLive.append = '%';
      this.healthsNotSeen = this.devices.filter((device: any) => {
        return device.Health === 'Not seen last 24hours' || device.Health === 'Not Reachable';
      });
      this.healthsNotSeen.label = this.translate.instant('dashboard.devices.notseen');
      this.healthsNotSeen.total = ((this.healthsNotSeen.length / this.devices.total) * 100).toFixed(0);
      this.healthsNotSeen.append = '%';
      this.healthsOthers = this.devices.filter((device: any) => {
        return (
          device.Health !== 'Not seen last 24hours' && device.Health !== 'Not Reachable' && device.Health !== 'Live'
        );
      });
      this.healthsOthers.label = this.translate.instant('dashboard.devices.enddevice');
      this.healthsOthers.total = ((this.healthsOthers.length / this.devices.total) * 100).toFixed(0);
      this.healthsOthers.append = '%';
      this.advancedPieDevice = [
        {
          name: this.translate.instant('dashboard.devices.routers'),
          value: this.routers.length
        },
        {
          name: this.translate.instant('dashboard.devices.enddevice'),
          value: this.devices.length - this.routers.length
        }
      ];
      this.advancedPieState = [
        {
          name: this.translate.instant('dashboard.devices.live'),
          value: this.healthsLive.length
        },
        {
          name: this.translate.instant('dashboard.devices.notseen'),
          value: this.healthsNotSeen.length
        },
        { name: this.translate.instant('dashboard.devices.others'), value: this.healthsOthers.length }
      ];
      this.devicesOnBattery = devices.filter((device: any) => device.LogicalType !== 'Router');
      const _batteryInf30 = this.devicesOnBattery.filter((device: any) => device.Battery < 30);
      const _batterySup30 = this.devicesOnBattery.filter((device: any) => device.Battery > 30 && device.Battery < 50);
      const _batterySup50 = this.devicesOnBattery.filter((device: any) => device.Battery > 50);
      this.batteryInf30 = this.devices.filter((it: any) => _batteryInf30.find((iter: any) => iter.IEEE === it.IEEE));
      this.batterySup50 = this.devices.filter((it: any) => _batterySup50.find((iter: any) => iter.IEEE === it.IEEE));
      this.batterySup30 = this.devices.filter((it: any) => _batterySup30.find((iter: any) => iter.IEEE === it.IEEE));
      this.batteryInf30.totalDevices = this.devicesOnBattery.length;
      this.batteryInf30.label = this.translate.instant('dashboard.devices.battery.inf.30');
      this.batteryInf30.total = this.batteryInf30.length;
      this.batteryInf30.append = this.translate.instant('devices');
      this.batterySup30.label = this.translate.instant('dashboard.devices.battery.sup.30');
      this.batterySup30.total = this.batterySup30.length;
      this.batterySup30.append = this.translate.instant('devices');
      this.batterySup50.label = this.translate.instant('dashboard.devices.battery.sup.50');
      this.batterySup50.total = this.batterySup50.length;
      this.batterySup50.append = this.translate.instant('devices');
      this.advancedPieBattery = [
        {
          name: this.translate.instant('dashboard.devices.battery.inf.30'),
          value: this.batteryInf30.length
        },
        {
          name: this.translate.instant('dashboard.devices.battery.sup.30'),
          value: this.batterySup30.length
        },
        { name: this.translate.instant('dashboard.devices.battery.sup.50'), value: this.batterySup50.length }
      ];
    });

    this.advancedPieLoadLabel = this.translate.instant('dashboard.trafic.maxload.label');
    this.advancedPieSentLabel = this.translate.instant('dashboard.trafic.total.trafic.sent.label');
    this.advancedPieReceivedLabel = this.translate.instant('dashboard.trafic.total.trafic.received.label');
    this.advancedPieDeviceLabel = this.translate.instant('dashboard.devices.label');
    this.advancedPieStateLabel = this.translate.instant('dashboard.devices.state.label');
    this.advancedPieBatteryLabel = this.translate.instant('dashboard.devices.battery.label');
  }

  percentageFormatting(value: any) {
    return Math.round(value);
  }

  open(name: string, event: any) {
    let devices;
    if (name === 'device') {
      if (event.name === this.translate.instant('dashboard.devices.routers')) {
        devices = this.routers;
      } else {
        devices = this.devicesOnBattery;
      }
    } else if (name === 'state') {
      if (event.name === this.translate.instant('dashboard.devices.live')) {
        devices = this.healthsLive;
      } else if (event.name === this.translate.instant('dashboard.devices.others')) {
        devices = this.healthsOthers;
      } else {
        devices = this.healthsNotSeen;
      }
    } else if (name === 'battery') {
      if (event.name === this.translate.instant('dashboard.devices.battery.inf.30')) {
        devices = this.batteryInf30;
      } else if (event.name === this.translate.instant('dashboard.devices.battery.sup.30')) {
        devices = this.batterySup30;
      } else {
        devices = this.batterySup50;
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

    this.toppyControl.listen('t_compins').subscribe(comp => {});

    this.toppyControl.open();
  }

  close() {
    if (this.toppyControl) {
      this.toppyControl.close();
    }
  }

  refresh() {
    this.getInfos();
    this.versionService.setReload(true);
  }

  ngOnDestroy(): void {
    this.close();
  }
}
