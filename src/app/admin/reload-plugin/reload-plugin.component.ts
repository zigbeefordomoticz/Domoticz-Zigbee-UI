import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { NotifyService } from '@app/services/notify.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('ReloadPluginComponent');

@Component({
  selector: 'app-reload-plugin',
  templateUrl: './reload-plugin.component.html',
  styleUrls: ['./reload-plugin.component.scss']
})
export class ReloadPluginComponent implements OnInit {
  constructor(
    private headerService: HeaderService,
    private modalService: NgbModal,
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  reloadPlugin() {
    this.apiService.getReloadPlugin().subscribe((result: any) => {
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
