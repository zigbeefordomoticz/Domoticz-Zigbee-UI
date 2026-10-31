import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { Plugin } from '@app/shared/models/plugin';
import { pluginIdentity, PluginIdentity } from '@app/shared/utils/plugin-identity';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';

type UpgradeState = 'idle' | 'running' | 'done' | 'failed';

/**
 * Admin → Plugin: upgrade in two steps (upgrade, then restart) and restart on its own.
 *
 * /plugin-upgrade runs the plugin's upgrade script and answers once it has finished, with its output
 * and return code. Nothing is applied until the plugin restarts.
 */
@Component({
  selector: 'app-admin-plugin',
  templateUrl: './admin-plugin.component.html',
  styleUrls: ['./admin-plugin.component.scss'],
  standalone: false
})
export class AdminPluginComponent implements OnInit {
  plugin: Plugin;
  identity: PluginIdentity;
  state: UpgradeState = 'idle';
  output = '';

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getPlugin().subscribe(plugin => {
      this.plugin = plugin;
      this.identity = pluginIdentity(plugin);
    });
  }

  upgrade() {
    this.state = 'running';
    this.output = '';
    this.apiService
      .getUpgradePlugin()
      .pipe(
        finalize(() => {
          if (this.state === 'running') {
            this.state = 'failed';
          }
        })
      )
      .subscribe((result: any) => {
        this.output = result?.result ?? '';
        if (result?.ReturnCode === 0) {
          this.state = 'done';
          this.toastr.success(this.translate.instant('admin.plugin.update.success'));
          this.headerService.setRestart(true);
        } else {
          this.state = 'failed';
          this.toastr.error(this.translate.instant('admin.plugin.update.error'));
        }
      });
  }

  confirmRestart(content: any) {
    // Dismissed (Cancel, ✕, Escape): nothing to do
    this.modalService.open(content, { ariaLabelledBy: 'restart-title' }).result.then(
      () => this.restart(),
      (): void => undefined
    );
  }

  private restart() {
    this.apiService.getReloadPlugin().subscribe(() => {
      this.toastr.success(this.translate.instant('admin.plugin.reload.notify'));
      this.headerService.setRestart(false);
    });
  }
}
