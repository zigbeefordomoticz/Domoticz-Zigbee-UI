import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('SwResetComponent');

@Component({
  selector: 'app-sw-reset',
  templateUrl: './sw-reset.component.html',
  styleUrls: ['./sw-reset.component.scss']
})
export class SwResetComponent implements OnInit {
  permitToJoin: any;

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  swReset(event: any) {
    this.apiService.getSwReset().subscribe(() => {
      this.toastr.success(this.translate.instant('admin.coordinator.swreset.notify'));
    });
  }
}
