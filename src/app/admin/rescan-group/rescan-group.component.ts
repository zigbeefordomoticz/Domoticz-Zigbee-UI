import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-rescan-group',
  templateUrl: './rescan-group.component.html',
  styleUrls: ['./rescan-group.component.scss']
})
export class RescanGroupComponent {
  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService,
    private headerService: HeaderService
  ) {}

  rescanGroup() {
    this.apiService.getRescanGroup().subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
      this.apiService.getRestartNeeded().subscribe(restart => {
        if (restart.RestartNeeded === 1) {
          this.headerService.setRestart(true);
        }
      });
    });
  }
}
