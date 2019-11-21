import { Component, OnInit } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';
import { Observable, timer, forkJoin } from 'rxjs';
import { concatMap, map, mergeMap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { UnsubscribeOnDestroyAdapter } from '../../shared/adapter/unsubscribe-adapter';
import { PluginStats } from '@app/shared/models/plugin-stats';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss']
})
export class VersionComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  plugin$: Observable<Plugin>;
  pluginHealth: any;
  pluginStats: PluginStats;
  received = 0;
  sent = 0;
  receivedPerSecond: string;
  sentPerSecond: string;

  constructor(private apiService: ApiService) {
    super();
  }

  ngOnInit(): void {
    this.plugin$ = this.apiService.getPlugin();

    this.subs.sink = timer(0, 5000)
      .pipe(concatMap(() => forkJoin([this.apiService.getPluginhealth(), this.apiService.getPluginStats()])))
      .pipe(
        map(([pluginHealth, pluginStats]) => {
          this.pluginHealth = pluginHealth;
          this.pluginStats = pluginStats;
          this.receivedPerSecond = Number((pluginStats.Received - this.received) / 5).toFixed(0);
          this.sentPerSecond = Number((pluginStats.Sent - this.sent) / 5).toFixed(0);
          this.sent = pluginStats.Sent;
          this.received = pluginStats.Received;
        })
      )
      .subscribe();
  }
}
