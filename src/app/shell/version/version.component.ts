import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss']
})
export class VersionComponent implements OnInit {
  plugin$: Observable<Plugin>;
  pluginHealth$: Observable<any>;
  pluginStats$: Observable<any>;

  constructor(private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.pluginStats$ = this.apiService.getPluginStats();
    this.plugin$ = this.apiService.getPlugin();
    this.pluginHealth$ = this.apiService.getPluginhealth();
  }
}
