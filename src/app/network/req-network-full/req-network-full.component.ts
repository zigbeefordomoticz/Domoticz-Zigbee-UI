import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

const log = new Logger('ReqNetworkInterComponent');

@Component({
  selector: 'app-req-network-full',
  templateUrl: './req-network-full.component.html',
  styleUrls: ['./req-network-full.component.scss']
})
export class ReqNetworkFullComponent implements OnInit {
  stats$: Observable<PluginStats>;

  constructor(private apiService: ApiService, private toastr: ToastrService, private translate: TranslateService) {}

  ngOnInit() {}

  reqFull() {
    this.apiService.getNwkFull().subscribe((result) => {
      this.toastr.success(this.translate.instant('api.global.succes.update.title'));
    });
  }
}
