import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { DomoticzEnv } from '@app/shared/models/domoticz-env';
import { Plugin } from '@app/shared/models/plugin';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { HeaderService } from '@app/services/header-service';

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
    private headerService: HeaderService,
    private modalService: NgbModal,
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

  reloadPlugin() {
    if (this.plugin === null || this.domoticzEnv === null) {
      this.disabled = true;
      return;
    }
    this.apiService.getReloadPlugin(this.plugin, this.domoticzEnv).subscribe((result: any) => {
      this.notifyService.notify('Plugin restarted');
      this.headerService.setRestart(false);
    });
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      result => {
        this.reloadPlugin();
      },
      reason => {}
    );
  }
}
