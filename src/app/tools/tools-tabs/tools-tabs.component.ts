import { Component, Input, OnInit } from '@angular/core';
import { HeaderService } from '@app/services/header-service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';

/**
 * Tabs on top of every Tools page. Errors carries a dot while the plugin reports errors not read yet.
 */
@Component({
  selector: 'app-tools-tabs',
  templateUrl: './tools-tabs.component.html',
  styleUrls: ['./tools-tabs.component.scss'],
  standalone: false
})
export class ToolsTabsComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  @Input() active: string;

  newErrors = false;

  readonly tabs: { path: string; label: string }[] = [
    { path: 'link', label: 'tools.tabs.data' },
    { path: 'command', label: 'tools.command' },
    { path: 'binding', label: 'tools.tabs.bindrep' },
    { path: 'debug', label: 'tools.debug' },
    { path: 'error', label: 'tools.tabs.errors' }
  ];

  constructor(private headerService: HeaderService) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.headerService.logError.subscribe(logError => (this.newErrors = !!logError));
  }
}
