import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { GlobalPosition, InsidePlacement, Toppy, ToppyControl } from 'toppy';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';

const log = new Logger('DashboardComponent');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  devices: any;
  routers: any;
  inDbs: any;
  healthsLive: any;
  healthsNotSeen: any;
  healthsOthers: any = {};
  pluginHealth: any;
  pluginStats: any;
  totalTraficSent: any = {};
  totalTraficRetx: any = {};
  totalTraficReceived: any = {};
  totalTraficCluster: any = {};
  totalTraficCrc: any = {};
  maxLoad: any = {};
  currentLoad: any = {};

  gaugeType = 'full';
  gaugeAppendText = '';
  thick = 15;

  toppyControl: ToppyControl;

  constructor(private apiService: ApiService, private translate: TranslateService, private toppy: Toppy) {}

  ngOnInit() {
    this.apiService.getPluginhealth().subscribe(res => {
      this.pluginHealth = res;
    });
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
      this.healthsNotSeen = this.devices.filter((device: any) => device.Health === 'Not seen last 24hours');
      this.healthsNotSeen.label = this.translate.instant('dashboard.devices.notseen');
      this.healthsNotSeen.total = ((this.healthsNotSeen.length / this.devices.total) * 100).toFixed(0);
      this.healthsNotSeen.append = '%';
      this.healthsOthers = this.devices.filter((device: any) => {
        return device.Health !== 'Not seen last 24hours' && device.Health !== 'Live';
      });
      this.healthsOthers.label = this.translate.instant('dashboard.devices.others');
      this.healthsOthers.total = ((this.healthsOthers.length / this.devices.total) * 100).toFixed(0);
      this.healthsOthers.append = '%';
    });
  }

  open(event: any) {
    this.toppyControl = this.toppy
      .position(
        new GlobalPosition({
          placement: InsidePlacement.BOTTOM,
          width: '80%',
          height: 'auto'
        })
      )
      .config({
        closeOnDocClick: true,
        closeOnEsc: true
      })
      .content(DeviceByNameComponent, { devices: event })
      .create();

    this.toppyControl.listen('t_compins').subscribe(comp => {});

    this.toppyControl.open();
  }
  close() {
    this.toppyControl.close();
  }
}
