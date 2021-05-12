import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@app/services/api.service';
import { Plugin } from '@app/shared/models/plugin';
import { Logger } from '@app/core';

const log = new Logger('PluginComponent');

@Component({
  selector: 'app-plugin',
  templateUrl: './plugin.component.html',
  styleUrls: ['./plugin.component.scss'],
})
export class PluginComponent implements OnInit {
  plugin$: Observable<Plugin>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.plugin$ = this.apiService.getPlugin();
  }
}
