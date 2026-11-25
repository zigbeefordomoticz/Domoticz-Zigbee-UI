import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { Plugin } from '@app/shared/models/plugin';
import { pluginIdentity, PluginIdentity } from '@app/shared/utils/plugin-identity';
import { pluginTone, Tone } from '@app/shared/utils/status-tone';
import { debugState, DebugState } from '../debug-state';

/**
 * Key figures and tabs on top of every Tools page, as on Admin. Errors carries a dot while the plugin reports
 * errors not read yet; it is not counted, as reading the error history marks the errors as read.
 */
@Component({
  selector: 'app-tools-tabs',
  templateUrl: './tools-tabs.component.html',
  styleUrls: ['../../shared/page-tabs.scss', './tools-tabs.component.scss'],
  standalone: false
})
export class ToolsTabsComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  @Input() active: string;

  plugin: Plugin;
  identity: PluginIdentity;
  pluginTone: Tone = 'secondary';
  debug: DebugState | null = null;
  newErrors = false;

  readonly tabs: { path: string; label: string }[] = [
    { path: 'link', label: 'tools.tabs.data' },
    { path: 'debug', label: 'tools.debug' },
    { path: 'error', label: 'tools.tabs.errors' }
  ];

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService
  ) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.headerService.logError.subscribe(logError => (this.newErrors = !!logError));
    this.apiService.getPlugin().subscribe(plugin => {
      this.plugin = plugin;
      this.identity = pluginIdentity(plugin);
      this.pluginTone = pluginTone(plugin);
    });
    this.refreshDebug();
  }

  /** Read the Debug figure again, after the Debug tab saved. */
  refreshDebug(): void {
    this.apiService.getSettingsDebug().subscribe(themes => (this.debug = debugState(themes)));
  }
}
