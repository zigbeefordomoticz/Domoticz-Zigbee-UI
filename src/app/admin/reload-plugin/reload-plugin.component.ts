import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

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
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  reloadPlugin() {
    this.apiService.getReloadPlugin().subscribe((result: any) => {
      this.toastr.success(this.translate.instant('api.global.succes.pluginrestarted.title'));
      this.headerService.setRestart(false);
    });
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        this.reloadPlugin();
      },
      (reason) => {}
    );
  }
}
