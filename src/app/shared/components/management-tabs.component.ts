import { Component, Input } from '@angular/core';

/**
 * Tabs on top of the Management pages, as on Admin, Network and Tools: Devices (/device) and Groups (/group).
 *
 * The two pages stay separate lazy-loaded modules; each shows these tabs with its own one marked active.
 */
@Component({
  selector: 'app-management-tabs',
  templateUrl: './management-tabs.component.html',
  styleUrls: ['../page-tabs.scss'],
  styles: ['.page-tabs { margin-top: 1rem; }'],
  standalone: false
})
export class ManagementTabsComponent {
  @Input() active: 'device' | 'group';

  readonly tabs: { path: 'device' | 'group'; label: string }[] = [
    { path: 'device', label: 'management.tabs.devices' },
    { path: 'group', label: 'management.tabs.groups' }
  ];
}
