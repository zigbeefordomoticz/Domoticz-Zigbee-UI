import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { TranslateService } from '@ngx-translate/core';
import { Plugin } from '@app/shared/models/plugin';

const log = new Logger('PermitToJoinComponent');

@Component({
  selector: 'app-reload-plugin',
  templateUrl: './reload-plugin.component.html',
  styleUrls: ['./reload-plugin.component.scss']
})
export class ReloadPluginComponent implements OnInit {
  permitToJoin: any;
  plugin: Plugin;

  constructor(
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getPlugin().subscribe(result => (this.plugin = result));
  }

  reloadPlugin(event: any) {
    this.apiService.getReloadPlugin(this.plugin).subscribe((result: any) => {
      this.notifyService.notify();
    });
  }
}
