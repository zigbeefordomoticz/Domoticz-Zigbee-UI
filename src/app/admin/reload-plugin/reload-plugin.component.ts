import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { Plugin } from '@app/shared/models/plugin';
import { TranslateService } from '@ngx-translate/core';
import { DomoticzEnv } from '@app/shared/models/domoticz-env';

const log = new Logger('ReloadPluginComponent');

@Component({
  selector: 'app-reload-plugin',
  templateUrl: './reload-plugin.component.html',
  styleUrls: ['./reload-plugin.component.scss']
})
export class ReloadPluginComponent implements OnInit {
  plugin: Plugin;
  domoticzEnv: DomoticzEnv;
  disabled = true;

  constructor(
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getPlugin().subscribe(plugin => {
      this.plugin = plugin;
      this.apiService.getDomoticzEnv().subscribe(env => {
        this.domoticzEnv = env;
        this.disabled = false;
      });
    });
  }

  reloadPlugin(event: any) {
    if (this.plugin === null || this.domoticzEnv === null) {
      this.disabled = true;
      return;
    }
    this.apiService.getReloadPlugin(this.plugin, this.domoticzEnv).subscribe((result: any) => {
      this.notifyService.notify('Plugin restarted');
    });
  }
}
