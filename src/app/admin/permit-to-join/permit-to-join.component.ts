import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormBuilder, FormGroupDirective, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { TranslateService } from '@ngx-translate/core';
import { PushNotificationsService } from 'ng-push';
import { NotifyService } from '@app/services/notify.service';
import { ApiService } from '@app/services/api.service';
import { Observable } from 'rxjs';

const log = new Logger('PermitToJoinComponent');

@Component({
  selector: 'app-permit-to-join',
  templateUrl: './permit-to-join.component.html',
  styleUrls: ['./permit-to-join.component.scss']
})
export class PermitToJoinComponent implements OnInit {
  permitToJoin: any;

  constructor(
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.permitToJoin = this.apiService.getPermitToJoin().subscribe(result => {
      this.permitToJoin = result;
    });
  }

  updatePermitToJoin(value: number) {
    this.permitToJoin.PermitToJoin = value;
    this.apiService.putPermitToJoin(this.permitToJoin).subscribe((result: any) => {
      this.notifyService.notify();
    });
  }
}
