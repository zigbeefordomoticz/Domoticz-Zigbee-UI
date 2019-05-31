import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { PluginStats } from '@app/dashboard/plugin-stats/plugin-stats';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { Logger } from '@app/core';

const log = new Logger('ReqTopologyComponent');

@Component({
  selector: 'app-req-topology',
  templateUrl: './req-topology.component.html',
  styleUrls: ['./req-topology.component.scss']
})
export class ReqTopologyComponent implements OnInit {
  stats$: Observable<PluginStats>;

  constructor(private apiService: ApiService, private notifyService: NotifyService) {}

  ngOnInit() {}

  reqTopology() {
    this.apiService.getReqTopologie().subscribe(result => {
      this.notifyService.notify();
    });
  }
}
