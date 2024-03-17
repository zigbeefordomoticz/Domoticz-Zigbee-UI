import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-req-network-inter',
  templateUrl: './req-network-inter.component.html',
  styleUrls: ['./req-network-inter.component.scss']
})
export class ReqNetworkInterComponent {
  stats$: Observable<PluginStats>;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  reqInter() {
    this.apiService.getReqInter().subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
    });
  }
}
