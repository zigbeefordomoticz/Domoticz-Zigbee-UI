import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

const log = new Logger('ErasePdmComponent');

@Component({
  selector: 'app-erase-pdm',
  templateUrl: './erase-pdm.component.html',
  styleUrls: ['./erase-pdm.component.scss']
})
export class ErasePdmComponent implements OnInit {
  permitToJoin: any;
  closeResult: string;

  constructor(
    private modalService: NgbModal,
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  erasePdm() {
    this.apiService.getZigateErasePDM().subscribe((result: any) => {
      this.notifyService.notify();
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
