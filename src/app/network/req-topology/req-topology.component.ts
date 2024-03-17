import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('ReqTopologyComponent');

@Component({
  selector: 'app-req-topology',
  templateUrl: './req-topology.component.html',
  styleUrls: ['./req-topology.component.scss']
})
export class ReqTopologyComponent implements OnInit {
  stats$: Observable<PluginStats>;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  reqTopology() {
    this.apiService.getReqTopologie().subscribe(result => {
      this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
    });
  }
}
