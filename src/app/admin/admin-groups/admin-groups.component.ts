import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { DeviceAvailable, DevicesAvailable, Group } from '@app/shared/models/group';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Subscription, timer } from 'rxjs';
import { concatMap } from 'rxjs/operators';

const POLL_PERIOD = 5000;
// The coordinator entry of /zgroup-list-available-device; it is not scanned from here
const COORDINATOR = '0000';

type Filter = 'all' | 'nogroup' | 'selected';

interface RouterRow {
  nwkId: string;
  name: string;
  model: string;
  widgets: DeviceAvailable[];
  groups: string[];
  asked?: Date;
}

/**
 * Admin → Groups: ask routers which Zigbee groups they belong to.
 *
 * Rows come from /zgroup-list-available-device (main-powered devices whose widgets can be in a
 * group), names and models from /zdevice-name, memberships from /zgroup. A scan only queues the
 * requests: /plugin-health GroupStatus is "scan" while they are sent, then "ready"; the routers
 * answer over the next minutes. GroupStatus is missing when group management is off.
 */
@Component({
  selector: 'app-admin-groups',
  templateUrl: './admin-groups.component.html',
  styleUrls: ['./admin-groups.component.scss'],
  standalone: false
})
export class AdminGroupsComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  rows: RouterRow[] = [];
  loaded = false;
  enabled = true;
  scanning = false;
  selected = new Set<string>();
  search = '';
  filter: Filter = 'all';

  private polling: Subscription;

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.apiService.getPluginhealth().subscribe(health => {
      this.enabled = health?.GroupStatus !== undefined;
      this.scanning = health?.GroupStatus === 'scan';
      if (this.enabled) {
        this.load();
        if (this.scanning) {
          this.follow();
        }
      } else {
        this.loaded = true;
      }
    });
  }

  override ngOnDestroy() {
    this.polling?.unsubscribe();
    super.ngOnDestroy();
  }

  get shown(): RouterRow[] {
    const text = this.search.trim().toLowerCase();
    return this.rows.filter(row => {
      if (this.filter === 'nogroup' && row.groups.length > 0) {
        return false;
      }
      if (this.filter === 'selected' && !this.selected.has(row.nwkId)) {
        return false;
      }
      return !text || [row.name, row.model, row.nwkId].some(value => value?.toLowerCase().includes(text));
    });
  }

  get allShownSelected(): boolean {
    const shown = this.shown;
    return shown.length > 0 && shown.every(row => this.selected.has(row.nwkId));
  }

  toggle(nwkId: string) {
    if (this.selected.has(nwkId)) {
      this.selected.delete(nwkId);
    } else {
      this.selected.add(nwkId);
    }
  }

  toggleShown() {
    const select = !this.allShownSelected;
    this.shown.forEach(row => (select ? this.selected.add(row.nwkId) : this.selected.delete(row.nwkId)));
  }

  scanAll() {
    this.apiService.getRescanGroup().subscribe(() => {
      this.started(this.rows.map(row => row.nwkId));
      this.apiService.getRestartNeeded().subscribe(restart => {
        if (restart?.RestartNeeded === 1) {
          this.headerService.setRestart(true);
        }
      });
    });
  }

  scanSelected() {
    const nwkIds = [...this.selected];
    this.apiService.putScanDeviceForGrp(nwkIds).subscribe(() => this.started(nwkIds));
  }

  refresh() {
    this.apiService.getZGroups().subscribe(groups => this.applyGroups(groups));
  }

  private started(nwkIds: string[]) {
    this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
    const now = new Date();
    this.rows.filter(row => nwkIds.includes(row.nwkId)).forEach(row => (row.asked = now));
    this.scanning = true;
    this.follow();
  }

  // While the plugin sends the requests; memberships are read again once it is done
  private follow() {
    if (this.polling) {
      return;
    }
    this.polling = timer(POLL_PERIOD, POLL_PERIOD)
      .pipe(concatMap(() => this.apiService.getPluginhealth()))
      .subscribe(health => {
        this.scanning = health?.GroupStatus === 'scan';
        if (!this.scanning) {
          this.polling.unsubscribe();
          this.polling = null;
          this.refresh();
        }
      });
  }

  private load() {
    forkJoin([
      this.apiService.getZGroupDevicesAvalaible(),
      this.apiService.getZDeviceName(),
      this.apiService.getZGroups()
    ]).subscribe(([available, names, groups]) => {
      this.rows = (available ?? [])
        .filter((device: DevicesAvailable) => device._NwkId !== COORDINATOR)
        .map((device: DevicesAvailable): RouterRow => {
          const named = (names ?? []).find((entry: DeviceByName) => entry._NwkId === device._NwkId);
          return {
            nwkId: device._NwkId,
            name: named?.ZDeviceName || device.WidgetList?.[0]?.ZDeviceName || device._NwkId,
            model: named?.Model || '',
            widgets: device.WidgetList ?? [],
            groups: []
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      this.applyGroups(groups);
      this.loaded = true;
    });
  }

  private applyGroups(groups: Group[]) {
    const list = Array.isArray(groups) ? groups : [];
    this.rows.forEach(row => {
      row.groups = list
        .filter(group => (group.Devices ?? []).some(device => device._NwkId === row.nwkId))
        .map(group => group.GroupName || group._GroupId);
    });
  }
}
