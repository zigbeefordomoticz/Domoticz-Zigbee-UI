import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-erase-pdm',
  templateUrl: './erase-pdm.component.html',
  styleUrls: ['./erase-pdm.component.scss']
})
export class ErasePdmComponent {
  permitToJoin: any;

  constructor(
    private modalService: NgbModal,
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  erasePdm() {
    this.apiService.getErasePDM().subscribe(() => {
      this.toastr.success(this.translate.instant('admin.erasepdm.notify'));
    });
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(() => {
      this.erasePdm();
    });
  }
}
