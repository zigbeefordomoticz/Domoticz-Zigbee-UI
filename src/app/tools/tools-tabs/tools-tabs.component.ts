import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';

/**
 * Tabs on top of every Tools page. Reporting is offered on zigpy radios only, as in the Tools menu;
 * Errors carries a dot while the plugin reports errors not read yet.
 */
@Component({
  selector: 'app-tools-tabs',
  templateUrl: './tools-tabs.component.html',
  styleUrls: ['./tools-tabs.component.scss'],
  standalone: false
})
export class ToolsTabsComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  @Input() active: string;

  zigpy = false;
  newErrors = false;

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService
  ) {
    super();
  }

  ngOnInit() {
    this.apiService.getPlugin().subscribe(plugin => (this.zigpy = !!plugin?.Zigpy));
    this.subs.sink = this.headerService.logError.subscribe(logError => (this.newErrors = !!logError));
  }

  get tabs(): { path: string; label: string }[] {
    return [
      { path: 'link', label: 'tools.tabs.data' },
      { path: 'command', label: 'tools.command' },
      { path: 'binding', label: 'tools.binding' },
      ...(this.zigpy ? [{ path: 'configure', label: 'tools.reporting.configure' }] : []),
      { path: 'debug', label: 'tools.debug' },
      { path: 'error', label: 'tools.tabs.errors' }
    ];
  }
}
