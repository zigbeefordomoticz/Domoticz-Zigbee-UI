import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { Logger } from '@app/core';
import { PluginStats } from '@app/shared/models/plugin-stats';

const log = new Logger('ReqNetworkInterComponent');

@Component({
  selector: 'app-req-network-full',
  templateUrl: './req-network-full.component.html',
  styleUrls: ['./req-network-full.component.scss']
})
export class ReqNetworkFullComponent implements OnInit {
  stats$: Observable<PluginStats>;

  constructor(private apiService: ApiService, private notifyService: NotifyService) {}

  ngOnInit() {}

  reqFull() {
    this.apiService.getNwkFull().subscribe(result => {
      this.notifyService.notify();
    });
  }
}
