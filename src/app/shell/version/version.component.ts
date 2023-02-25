import { Component, OnInit } from '@angular/core';
import { HeaderService } from '@app/services/header-service';
import { environment } from '@env/environment';
import { MatomoTracker } from '@ngx-matomo/tracker';
import { forkJoin, Observable, timer } from 'rxjs';
import { filter, map, retry, share, switchMap, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { VersionService } from '../../services/version-service';
import { UnsubscribeOnDestroyAdapter } from '../../shared/adapter/unsubscribe-adapter';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss']
})
export class VersionComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  fork$: Observable<any>;
  poll = false;
  fork: any;

  constructor(
    private apiService: ApiService,
    private versionService: VersionService,
    private headerService: HeaderService,
    private readonly tracker: MatomoTracker
  ) {
    super();
  }

  ngOnInit(): void {
    this.fork$ = forkJoin([
      this.apiService.getPluginhealth(),
      this.apiService.getPluginStats(),
      this.apiService.getPlugin()
    ]).pipe(
      map(([pluginHealth, pluginStats, plugin]) => {
        this.headerService.setError(pluginStats.Error);
        this.fork = { pluginHealth, pluginStats, plugin };
        if (plugin) {
          sessionStorage.setItem('plugin', JSON.stringify(plugin));
          this.tracker.setUserId(plugin.CoordinatorIEEE);
          this.tracker.setCustomVariable(1, 'CoordinatorModel', plugin.CoordinatorModel, 'visit');
          this.tracker.setCustomVariable(2, 'PluginVersion', plugin.PluginVersion, 'visit');
          this.tracker.setCustomVariable(3, 'CoordinatorFirmwareVersion', plugin.CoordinatorFirmwareVersion, 'visit');
          this.tracker.setCustomVariable(4, 'NetworkSize', plugin.NetworkSize, 'visit');
          this.tracker.setCustomVariable(4, 'CertifiedDbVersion', plugin.CertifiedDbVersion, 'visit');
        }
      })
    );

    this.subs.sink = this.headerService.polling.subscribe(poll => {
      this.poll = poll;
      this.subs.add(
        timer(1, environment.refresh)
          .pipe(
            switchMap(() => this.fork$),
            retry(),
            share(),
            takeUntil(this.headerService.polling.pipe(filter(val => val === false)))
          )
          .subscribe()
      );
    });

    this.versionService.reload.subscribe(reload => {
      this.fork$.subscribe();
    });
  }
}
