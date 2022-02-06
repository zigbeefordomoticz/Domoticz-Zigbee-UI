import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('ErasePdmComponent');

@Component({
  selector: 'app-erase-pdm',
  templateUrl: './erase-pdm.component.html',
  styleUrls: ['./erase-pdm.component.scss']
})
export class ErasePdmComponent implements OnInit {
  permitToJoin: any;

  constructor(
    private modalService: NgbModal,
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  erasePdm() {
    this.apiService.getErasePDM().subscribe((result: any) => {
      this.toastr.success(this.translate.instant('admin.erasepdm.notify'));
    });
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      result => {
        this.erasePdm();
      },
      reason => {}
    );
  }
}
