import { Component, OnInit } from '@angular/core';
import { PluginStats } from '@app/dashboard/plugin-stats/plugin-stats';
import { ApiService } from '@app/services/api.service';
import { Observable } from 'rxjs';
import { Logger } from '@app/core';

const log = new Logger('NwkStatsComponent');

@Component({
  selector: 'app-nwk-stats',
  templateUrl: './nwk-stats.component.html',
  styleUrls: ['./nwk-stats.component.scss']
})
export class NwkStatsComponent implements OnInit {
  stats$: Observable<PluginStats>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.stats$ = this.apiService.getNwkStats();
  }
}
