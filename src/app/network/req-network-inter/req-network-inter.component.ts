import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { Logger } from '@app/core';
import { PluginStats } from '@app/shared/models/plugin-stats';

const log = new Logger('ReqNetworkInterComponent');

@Component({
  selector: 'app-req-network-inter',
  templateUrl: './req-network-inter.component.html',
  styleUrls: ['./req-network-inter.component.scss']
})
export class ReqNetworkInterComponent implements OnInit {
  stats$: Observable<PluginStats>;

  constructor(private apiService: ApiService, private notifyService: NotifyService) {}

  ngOnInit() {}

  reqInter() {
    this.apiService.getReqInter().subscribe(result => {
      this.notifyService.notify();
    });
  }
}
