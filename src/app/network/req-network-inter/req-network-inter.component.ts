import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('ReqNetworkInterComponent');

@Component({
  selector: 'app-req-network-inter',
  templateUrl: './req-network-inter.component.html',
  styleUrls: ['./req-network-inter.component.scss']
})
export class ReqNetworkInterComponent implements OnInit {
  stats$: Observable<PluginStats>;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  reqInter() {
    this.apiService.getReqInter().subscribe(result => {
      this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
    });
  }
}
