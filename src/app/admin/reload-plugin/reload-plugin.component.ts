import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reload-plugin',
  templateUrl: './reload-plugin.component.html',
  styleUrls: ['./reload-plugin.component.scss']
})
export class ReloadPluginComponent {
  constructor(
    private headerService: HeaderService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) { }

  reloadPlugin() {
    this.apiService.getReloadPlugin().subscribe(() => {
      this.toastr.success(this.translate.instant('admin.plugin.reload.notify'));
      this.headerService.setRestart(false);
    });
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => {
        this.reloadPlugin();
      }
    );
  }
}
