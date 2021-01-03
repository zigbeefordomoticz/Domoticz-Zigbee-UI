import { Component, OnInit } from '@angular/core';
import { HeaderService } from '@app/services/header-service';
import { environment } from '@env/environment';
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

  constructor(
    private apiService: ApiService,
    private versionService: VersionService,
    private headerService: HeaderService
  ) {
    super();
  }

  ngOnInit(): void {
    this.fork$ = this.versionService.reload.asObservable().pipe(
      switchMap(_ =>
        forkJoin([
          this.apiService.getPluginhealth(),
          this.apiService.getPluginStats(),
          this.apiService.getPlugin()
        ]).pipe(
          map(([pluginHealth, pluginStats, plugin]) => {
            return { pluginHealth, pluginStats, plugin };
          })
        )
      )
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
  }
}
