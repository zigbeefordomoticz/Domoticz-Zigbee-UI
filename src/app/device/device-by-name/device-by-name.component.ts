import { Clipboard } from '@angular/cdk/clipboard';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const log = new Logger('DeviceByNameComponent');

// Plugin Health values, compared verbatim (see shared/utils/health-label.pipe.ts)
const HEALTH_RANK: { [health: string]: number } = {
  'Not Reachable': 0,
  TimedOut: 1,
  'Not seen last 24hours': 1,
  unknown: 2,
  '': 2,
  Disabled: 3,
  Live: 4
};
const HEALTH_TONE: { [health: string]: string } = {
  Live: 'success',
  TimedOut: 'warning',
  'Not seen last 24hours': 'warning',
  'Not Reachable': 'danger',
  Disabled: 'secondary'
};
// Same threshold as the dashboard "Battery below 15 %" item
const LOW_BATTERY = 15;
// Above any battery level: mains powered devices sort after battery ones
const MAINS_SORT = 1000;

type Filter = 'all' | 'attention' | 'notoptimized' | 'disabled' | 'routers' | 'enddevices';

/** One table row: the device as the plugin sent it, plus what the columns sort and filter on. */
interface DeviceRow {
  device: DeviceByName;
  name: string;
  widgetCount: number;
  router: boolean;
  mains: boolean;
  battery: number | null;
  lowBattery: boolean;
  powerSort: number;
  lqi: number;
  healthRank: number;
  healthTone: string;
  statusWarning: string;
  paramCount: number;
  attention: boolean;
}

@Component({
  selector: 'app-device-by-name',
  templateUrl: './device-by-name.component.html',
  styleUrls: ['./device-by-name.component.scss'],
  standalone: false
})
export class DeviceByNameComponent implements OnChanges {
  @Input() devices: DeviceByName[];
  rows: DeviceRow[] = [];
  visibleRows: DeviceRow[] = [];
  filters: { id: Filter; count: number }[] = [];
  filter: Filter = 'all';
  // The device whose name is being edited in its row, and the text typed so far
  editingNwkId: string = null;
  nameDraft = '';
  saving = false;
  rowToDelete: DeviceByName;
  rowParameter: DeviceByName;
  parameter: string;
  enabled = false;
  prefixEnabled = 'Disabled';
  enabledTrue = "'Disabled': 0";
  enabledFalse = "'Disabled': 1";
  showRSSI = false;

  private readonly filterTests: { [id in Filter]: (row: DeviceRow) => boolean } = {
    all: () => true,
    attention: row => row.attention,
    notoptimized: row => !row.device.CertifiedDevice,
    disabled: row => row.device.Health === 'Disabled',
    routers: row => row.router,
    enddevices: row => !row.router
  };

  // Focus the name input as soon as a row switches to edit mode; select once ngModel has filled it
  @ViewChild('nameInput') set nameInput(input: ElementRef<HTMLInputElement>) {
    input?.nativeElement.focus();
    setTimeout(() => input?.nativeElement.select());
  }

  constructor(
    private apiService: ApiService,
    private translate: TranslateService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private clipboard: Clipboard
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.devices.currentValue !== changes.devices.previousValue) {
      const devices = Array.isArray(this.devices) ? this.devices : [];
      this.showRSSI = devices.filter(device => device.RSSI).length > 0;
      this.rows = devices.map(device => this.toRow(device));
      this.applyFilter();
    }
  }

  setFilter(filter: Filter) {
    this.filter = filter;
    this.applyFilter();
  }

  open(content: any) {
    // Cancel, the cross and Escape dismiss: the promise rejects, nothing to do
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => this.delete(),
      () => undefined
    );
  }

  editParameter(content: any): void {
    this.parameter = this.rowParameter.Param || '{}';

    this.enabled = !this.parameter.includes(this.enabledFalse);
    if (this.enabled) {
      this.parameter = this.parameter.replace(this.enabledTrue.concat(','), '');
      this.parameter = this.parameter.replace(this.enabledTrue, '');
    } else {
      this.parameter = this.parameter.replace(this.enabledFalse.concat(','), '');
      this.parameter = this.parameter.replace(this.enabledFalse, '');
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => {
        if (this.parameter.includes(this.prefixEnabled)) {
          this.toastr.error(this.translate.instant('device.byname.error.notify'));
        } else {
          if (this.enabled) {
            this.parameter = this.parameter.replace('{', '{'.concat(this.enabledTrue).concat(', '));
          } else {
            this.parameter = this.parameter.replace('{', '{'.concat(this.enabledFalse).concat(', '));
          }
          this.saveDevice(this.rowParameter, { Param: this.parameter }).subscribe(() =>
            this.toastr.success(this.translate.instant('api.global.succes.saved.notify'))
          );
        }
      },
      () => undefined
    );
  }

  onChangeEnabled() {
    this.enabled = !this.enabled;
  }

  delete() {
    this.apiService.deleteZDeviceName(this.rowToDelete._NwkId).subscribe(() => {
      this.rows = this.rows.filter(row => row.device !== this.rowToDelete);
      this.rowToDelete = null;
      this.applyFilter();
    });
  }

  startEdit(row: DeviceRow) {
    this.editingNwkId = row.device._NwkId;
    this.nameDraft = row.device.ZDeviceName ?? '';
  }

  cancelEdit() {
    if (!this.saving) {
      this.editingNwkId = null;
    }
  }

  /** Enter: send this device only. An unchanged name just leaves edit mode. */
  saveName(row: DeviceRow) {
    const name = this.nameDraft.trim();
    if (this.saving) {
      return;
    }
    if (name === (row.device.ZDeviceName ?? '')) {
      this.editingNwkId = null;
      return;
    }
    this.saving = true;
    this.saveDevice(row.device, { ZDeviceName: name }).subscribe({
      next: () => {
        this.saving = false;
        this.editingNwkId = null;
        this.toastr.success(this.translate.instant('device.byname.name.saved', { name: name || row.device._NwkId }));
      },
      // The error is already toasted by ApiService; keep the input so the name can be retried
      error: () => (this.saving = false)
    });
  }

  /**
   * PUT /zdevice-name with this one device. The plugin reads IEEE, ZDeviceName and Param of each row it
   * receives (Param is required, even for a rename) and leaves every other device alone.
   */
  private saveDevice(device: DeviceByName, changes: Partial<DeviceByName>): Observable<void> {
    return this.apiService.putZDeviceName([{ ...device, ...changes }]).pipe(
      map(result => {
        log.debug(result);
        Object.assign(device, changes);
        this.refreshRow(device);
      })
    );
  }

  copy(row: DeviceByName) {
    this.apiService.getNonOptimizedDevice(row._NwkId).subscribe(json => this.clipboard.copy(JSON.stringify(json)));
  }

  /** A saved change: the table sorts and searches on the row's copy. */
  private refreshRow(device: DeviceByName) {
    const index = this.rows.findIndex(row => row.device === device);
    if (index > -1) {
      this.rows[index] = this.toRow(device);
      this.applyFilter();
    }
  }

  private applyFilter() {
    this.filters = (Object.keys(this.filterTests) as Filter[]).map(id => ({
      id,
      count: this.rows.filter(this.filterTests[id]).length
    }));
    this.visibleRows = this.rows.filter(this.filterTests[this.filter]);
  }

  private toRow(device: DeviceByName): DeviceRow {
    const capabilities = Array.isArray(device.MacCapa) ? device.MacCapa : [];
    const mains = capabilities.includes('MainPower');
    // "" or {} when the plugin has no battery reading; a number, or a string for IASBattery
    const level =
      device.Battery === '' || device.Battery === null || typeof device.Battery === 'object'
        ? NaN
        : Number(device.Battery);
    const battery = mains || isNaN(level) ? null : level;
    const lowBattery = battery !== null && battery <= LOW_BATTERY;
    const consistency = device.ConsistencyCheck;
    const statusWarning =
      consistency === 'Bad Pairing'
        ? 'device.byname.status.badpairing'
        : consistency === 'not in DZ'
          ? 'device.byname.status.notindz'
          : device.Status && device.Status !== 'inDB'
            ? 'device.byname.status.other'
            : '';
    const healthRank = HEALTH_RANK[device.Health ?? ''] ?? HEALTH_RANK.unknown;
    return {
      device,
      name: device.ZDeviceName || device.Model || device._NwkId,
      widgetCount: (device.WidgetList ?? []).length,
      router: capabilities.includes('FFD'),
      mains,
      battery,
      lowBattery,
      powerSort: mains ? MAINS_SORT : (battery ?? -1),
      lqi: Number(device.LQI) || 0,
      healthRank,
      healthTone: HEALTH_TONE[device.Health] ?? 'secondary',
      statusWarning,
      paramCount: this.paramKeys(device.Param).filter(key => key !== 'Disabled').length,
      attention: healthRank < HEALTH_RANK.unknown || lowBattery || statusWarning !== ''
    };
  }

  /** Keys of the Param the plugin sends as a Python dict repr ("{'Disabled': 0, 'Calibration': 0}"). */
  private paramKeys(param: string): string[] {
    return [...String(param ?? '').matchAll(/['"]([^'"]+)['"]\s*:/g)].map(match => match[1]);
  }
}
