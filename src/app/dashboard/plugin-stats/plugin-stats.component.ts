import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { PluginStats } from './plugin-stats';

@Component({
  selector: 'app-plugin-stats',
  templateUrl: './plugin-stats.component.html',
  styleUrls: ['./plugin-stats.component.scss']
})
export class PluginStatsComponent implements OnInit {
  plugin$: Observable<PluginStats>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.plugin$ = this.apiService.getPluginStats();
  }
}
