import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-req-network-full',
  templateUrl: './req-network-full.component.html',
  styleUrls: ['./req-network-full.component.scss']
})
export class ReqNetworkFullComponent {
  stats$: Observable<PluginStats>;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }


  reqFull() {
    this.apiService.getNwkFull().subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
    });
  }
}
