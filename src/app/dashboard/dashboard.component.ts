import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { DevicesAvailable } from '@app/shared/models/group';
import { TranslateService } from '@ngx-translate/core';

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
  heaths: any;

  gaugeType = 'full';
  gaugeAppendText = '';
  thick = 15;

  pluginHealth: any;
  constructor(private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.apiService.getPluginhealth().subscribe(res => {
      this.pluginHealth = res;
    });
    this.apiService.getZDevices().subscribe(devices => {
      this.devices = devices;
      this.devices.total = this.devices.length;
      this.devices.label = this.translate.instant('devices');
      this.routers = this.devices.filter((router: any) => router.LogicalType === 'Router');
      this.routers.label = 'Routers';
      this.routers.total = ((this.routers.length / this.devices.total) * 100).toFixed(0);
      this.routers.append = '%';
      this.inDbs = this.devices.filter((router: any) => router.Status === 'inDB');
      this.inDbs.label = 'In DB';
      this.inDbs.total = ((this.inDbs.length / this.devices.total) * 100).toFixed(0);
      this.inDbs.append = '%';
    });
  }
}
