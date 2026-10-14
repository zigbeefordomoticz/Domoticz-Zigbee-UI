import { Component, OnInit } from '@angular/core';
import { HeaderService } from '@app/services/header-service';
import { environment } from '@env/environment';
import { forkJoin, Observable, Subscription, timer } from 'rxjs';
import { filter, map, retry, share, switchMap, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { VersionService } from '../../services/version-service';
import { UnsubscribeOnDestroyAdapter } from '../../shared/adapter/unsubscribe-adapter';

/**
 * How often the footer re-reads `/plugin-health` while a topology scan is
 * running.
 *
 * The footer only refreshes on its own when auto-refresh is on, which it is
 * not by default — so without this the scan indicator would appear at the next
 * navigation and, worse, stay on screen long after the scan had finished. The
 * timer exists only while a scan does, so an idle plugin is polled exactly as
 * much as it was before.
 */
const TOPOLOGY_REFRESH = 15000;

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss'],
  standalone: false
})
export class VersionComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  fork$: Observable<any>;
  poll = false;
  fork: any;

  private topologyPoll: Subscription;

  constructor(
    private apiService: ApiService,
    private versionService: VersionService,
    private headerService: HeaderService
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
        this.watchTopologyScan(!!pluginHealth?.Topology);
        if (plugin) {
          sessionStorage.setItem('plugin', JSON.stringify(plugin));
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

    this.versionService.reload.subscribe(() => {
      this.fork$.subscribe();
    });
  }

  /**
   * Keep the footer honest for the length of a scan.
   *
   * A scan runs for minutes, so an indicator that cannot clear itself is worse
   * than none. This starts when one is reported and stops as soon as it is
   * not, and stands aside when auto-refresh is already doing the same work.
   */
  private watchTopologyScan(scanning: boolean): void {
    if (!scanning || this.poll) {
      this.topologyPoll?.unsubscribe();
      this.topologyPoll = undefined;
      return;
    }
    if (this.topologyPoll && !this.topologyPoll.closed) {
      return;
    }
    this.topologyPoll = timer(TOPOLOGY_REFRESH, TOPOLOGY_REFRESH)
      .pipe(switchMap(() => this.fork$))
      .subscribe();
    this.subs.add(this.topologyPoll);
  }
}
