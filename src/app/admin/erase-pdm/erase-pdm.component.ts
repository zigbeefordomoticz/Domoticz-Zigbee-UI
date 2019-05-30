import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('PermitToJoinComponent');

@Component({
  selector: 'app-erase-pdm',
  templateUrl: './erase-pdm.component.html',
  styleUrls: ['./erase-pdm.component.scss']
})
export class ErasePdmComponent implements OnInit {
  permitToJoin: any;

  constructor(
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  erasePdm(event: any) {
    this.apiService.getZigateErasePDM().subscribe((result: any) => {
      this.notifyService.notify();
    });
  }
}
