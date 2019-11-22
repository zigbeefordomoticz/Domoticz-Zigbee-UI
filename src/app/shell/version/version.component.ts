import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { VersionService } from '../../services/version-service';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss']
})
export class VersionComponent implements OnInit {
  fork$: Observable<any>;

  constructor(private apiService: ApiService, private versionService: VersionService) {}

  ngOnInit(): void {
    this.getInfos();
  }

  private getInfos() {
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
  }
}
