import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('CommandComponent');

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss']
})
export class CommandComponent implements OnInit {
  devices: any;
  routers: any;

  constructor(private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.apiService.getZDevices().subscribe(devices => {
      this.devices = devices;
      this.routers = this.devices.filter((router: any) => router.LogicalType === 'Router');
    });
  }
}
