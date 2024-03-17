import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-req-topology',
  templateUrl: './req-topology.component.html',
  styleUrls: ['./req-topology.component.scss']
})
export class ReqTopologyComponent {
  stats$: Observable<PluginStats>;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  reqTopology() {
    this.apiService.getReqTopologie().subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
    });
  }
}
