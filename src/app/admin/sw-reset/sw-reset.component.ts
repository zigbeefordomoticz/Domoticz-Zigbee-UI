import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-sw-reset',
  templateUrl: './sw-reset.component.html',
  styleUrls: ['./sw-reset.component.scss']
})
export class SwResetComponent {
  permitToJoin: any;

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) { }


  swReset() {
    this.apiService.getSwReset().subscribe(() => {
      this.toastr.success(this.translate.instant('admin.coordinator.swreset.notify'));
    });
  }
}
