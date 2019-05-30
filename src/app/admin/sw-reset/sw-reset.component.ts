import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('PermitToJoinComponent');

@Component({
  selector: 'app-sw-reset',
  templateUrl: './sw-reset.component.html',
  styleUrls: ['./sw-reset.component.scss']
})
export class SwResetComponent implements OnInit {
  permitToJoin: any;

  constructor(
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  swReset(event: any) {
    this.apiService.getSwResetZigate().subscribe((result: any) => {
      this.notifyService.notify();
    });
  }
}
