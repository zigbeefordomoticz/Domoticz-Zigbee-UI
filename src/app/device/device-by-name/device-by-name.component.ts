import { Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DeviceByName } from '@app/shared/models/device-by-name';
import {
  countDevices,
  deviceState,
  DeviceState,
  isDisabled,
  isNotHeard,
  LOW_BATTERY,
  pairingProblem
} from '@app/shared/utils/device-state';
import { healthTone } from '@app/shared/utils/health-label.pipe';
import { devicesTone, Tone } from '@app/shared/utils/status-tone';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DetailsAction, DeviceDetailsComponent } from '../device-details/device-details.component';
import { GreenPowerDetailsAction, GreenPowerDetailsComponent } from '../device-details/green-power-details.component';
import { DeviceParamEditorComponent } from '../device-param-editor/device-param-editor.component';
import { parsePluginParam } from '../device-param-editor/plugin-param';

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
// Below it the LQI bar is red
const WEAK_LQI = 40;
// Above any battery level: mains powered devices sort after battery ones
const MAINS_SORT = 1000;

type Filter =
  | 'all'
  | 'attention'
  | 'lowbattery'
  | 'weaklink'
  | 'notoptimized'
  | 'disabled'
  | 'routers'
  | 'enddevices'
  | 'greenpower';

// Chips shown only when they have something to list
const OPTIONAL_FILTERS: Filter[] = ['lowbattery', 'weaklink', 'greenpower'];

/** A key figure on top of the list; a click shows the devices it counts. */
interface KeyFigure {
  filter: Filter;
  label: string;
  value: string;
  detail: string;
  tone: Tone;
}

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
  disabled: boolean;
  attention: boolean;
  weakLink: boolean;
  // Only a device that failed pairing, is not in Domoticz or has no widget can be removed
  removable: boolean;
  // Green Power: its own details window; no name or parameters (they act on ListOfDevices)
  greenPower: boolean;
}

@Component({
  selector: 'app-device-by-name',
  templateUrl: './device-by-name.component.html',
  styleUrls: ['../../shared/page-tabs.scss', './device-by-name.component.scss'],
  standalone: false
})
export class DeviceByNameComponent extends UnsubscribeOnDestroyAdapter implements OnChanges, OnInit {
  @Input() devices: DeviceByName[];
  // Green Power devices: removed from their details window when they have no widget, else with their last widget
  @Input() greenPower: DeviceByName[] = [];
  rows: DeviceRow[] = [];
  visibleRows: DeviceRow[] = [];
  figures: KeyFigure[] = [];
  filters: { id: Filter; count: number }[] = [];
  filter: Filter = 'all';
  // The device whose name is being edited in its row, and the text typed so far
  editingNwkId: string = null;
  nameDraft = '';
  saving = false;
  rowToDelete: DeviceByName;
  showRSSI = false;

  private readonly filterTests: { [id in Filter]: (row: DeviceRow) => boolean } = {
    all: () => true,
    attention: row => row.attention,
    lowbattery: row => !row.disabled && row.lowBattery,
    weaklink: row => row.weakLink,
    // Disabled devices are in their own chip only, as on the Dashboard
    notoptimized: row => !row.greenPower && !row.disabled && !row.device.CertifiedDevice,
    disabled: row => row.disabled,
    routers: row => !row.disabled && row.router,
    enddevices: row => !row.disabled && !row.router && !row.greenPower,
    greenpower: row => row.greenPower
  };

  @ViewChild('content') private removeConfirm: TemplateRef<unknown>;

  // Focus the name input as soon as a row switches to edit mode; select once ngModel has filled it
  @ViewChild('nameInput') set nameInput(input: ElementRef<HTMLInputElement>) {
    input?.nativeElement.focus();
    setTimeout(() => input?.nativeElement.select());
  }

  constructor(
    private apiService: ApiService,
    private translate: TranslateService,
    private modalService: NgbModal,
    private offcanvas: NgbOffcanvas,
    private toastr: ToastrService
  ) {
    super();
  }

  // The figures are translated once built: again in another language
  ngOnInit(): void {
    this.subs.sink = this.translate.onLangChange.subscribe(() => (this.figures = this.buildFigures()));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.devices || changes.greenPower) {
      const devices = Array.isArray(this.devices) ? this.devices : [];
      const greenPower = Array.isArray(this.greenPower) ? this.greenPower : [];
      this.showRSSI = devices.filter(device => device.RSSI).length > 0;
      this.rows = [...devices, ...greenPower].map(device => this.toRow(device));
      this.applyFilter();
    }
  }

  setFilter(filter: Filter) {
    this.filter = filter;
    this.applyFilter();
  }

  /** A click on a key figure: its devices, or all of them again. */
  toggleFilter(filter: Filter) {
    this.setFilter(this.filter === filter ? 'all' : filter);
  }

  open(content: any) {
    // Cancel, the cross and Escape dismiss: the promise rejects, nothing to do
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => this.delete(),
      (): void => undefined
    );
  }

  /** A click on the row, outside its buttons and inputs, or Enter on the focused row. */
  openDetails(event: Event, row: DeviceRow) {
    const target = event.target as HTMLElement;
    if (event.type === 'keydown' ? target !== event.currentTarget : target.closest('button, a, input, .input-group')) {
      return;
    }
    if (row.greenPower) {
      this.openGreenPowerDetails(row);
      return;
    }
    const details = this.modalService.open(DeviceDetailsComponent, {
      size: 'lg',
      scrollable: true,
      ariaLabelledBy: 'device-details-title'
    });
    details.componentInstance.device = row.device;
    details.componentInstance.canRemove = row.removable;
    details.componentInstance.healthTone = row.healthTone;
    details.result.then(
      (action: DetailsAction) => {
        if (action === 'parameters') {
          this.editParameters(row);
        } else if (action === 'remove') {
          this.rowToDelete = row.device;
          this.open(this.removeConfirm);
        }
      },
      (): void => undefined
    );
  }

  /** Green Power details: a device without widgets can get a device type or be removed there. */
  private openGreenPowerDetails(row: DeviceRow) {
    const details = this.modalService.open(GreenPowerDetailsComponent, {
      size: 'lg',
      scrollable: true,
      ariaLabelledBy: 'device-details-title'
    });
    details.componentInstance.device = row.device;
    details.result.then(
      (action: GreenPowerDetailsAction) => {
        if (action === 'remove') {
          this.rowToDelete = row.device;
          this.open(this.removeConfirm);
        }
      },
      (): void => undefined
    );
  }

  /** Parameters side panel; it closes only once the plugin has accepted the change. */
  editParameters(row: DeviceRow) {
    if (row.greenPower) {
      return;
    }
    const device = row.device;
    const panel = this.offcanvas.open(DeviceParamEditorComponent, {
      position: 'end',
      panelClass: 'device-param-panel',
      ariaLabelledBy: 'device-param-editor-title'
    });
    panel.componentInstance.device = device;
    panel.componentInstance.save = (param: string) => {
      const disabled = !!parsePluginParam(param).values?.Disabled;
      // What the plugin does on a Param change: Health Disabled, or unknown when re-enabled; applied at heartbeat
      const health = disabled ? 'Disabled' : device.Health === 'Disabled' ? 'unknown' : device.Health;
      return this.saveDevice(device, { Param: param, CheckParam: true, Health: health }).pipe(
        tap(() => this.toastr.success(this.translate.instant('device.param.saved', { name: row.name })))
      );
    };
    // Cancel, the cross, Escape and a click outside dismiss: nothing to do
    panel.result.then(
      (): void => undefined,
      (): void => undefined
    );
  }

  delete() {
    // A Green Power device is not in the plugin's device list: its own route, by IEEE
    const removal = this.rowToDelete.GreenPower
      ? this.apiService.deleteZgpDevice(this.rowToDelete.IEEE)
      : this.apiService.deleteZDeviceName(this.rowToDelete._NwkId);
    removal.subscribe(() => {
      this.rows = this.rows.filter(row => row.device !== this.rowToDelete);
      this.toastr.success(this.translate.instant('device.details.removed'));
      this.rowToDelete = null;
      this.applyFilter();
    });
  }

  startEdit(row: DeviceRow) {
    if (row.greenPower) {
      return;
    }
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

  /** A saved change: the table sorts and searches on the row's copy. */
  private refreshRow(device: DeviceByName) {
    const index = this.rows.findIndex(row => row.device === device);
    if (index > -1) {
      this.rows[index] = this.toRow(device);
      this.applyFilter();
    }
  }

  private applyFilter() {
    this.filters = (Object.keys(this.filterTests) as Filter[])
      .map(id => ({ id, count: this.rows.filter(this.filterTests[id]).length }))
      .filter(chip => chip.count > 0 || chip.id === this.filter || !OPTIONAL_FILTERS.includes(chip.id));
    this.visibleRows = this.rows.filter(this.filterTests[this.filter]);
    this.figures = this.buildFigures();
  }

  /** Same rules and words as the Dashboard (shared/utils/device-state.ts). */
  private buildFigures(): KeyFigure[] {
    const t = (key: string, params?: object): string => this.translate.instant(key, params);
    const count = (filter: Filter) => this.rows.filter(this.filterTests[filter]).length;
    const rows = this.rows.filter(row => !row.greenPower);
    const enabled = rows.filter(row => !row.disabled);
    const counts = countDevices(rows.map(row => row.device));
    const notLive = counts.enabled - counts.live;
    // Never polled, so it cannot be "not live": it counts on both sides
    const greenPower = this.rows.length - rows.length;

    const inState = (state: DeviceState) => enabled.filter(row => deviceState(row.device) === state).length;
    const notReachable = inState('notreachable');
    const reasons = [
      { label: 'device.health.notreachable', count: notReachable },
      { label: 'device.health.notseen', count: inState('notseen') },
      { label: 'device.health.timedout', count: inState('timedout') },
      { label: 'device.byname.filter.lowbattery', count: count('lowbattery') },
      { label: 'dashboard.attention.pairing', count: enabled.filter(row => row.statusWarning).length }
    ].filter(reason => reason.count > 0);

    const attention = count('attention');
    const lowBattery = count('lowbattery');
    const weakLink = count('weaklink');
    const notOptimized = count('notoptimized');
    return [
      {
        filter: 'all',
        label: t('dashboard.kpi.devices'),
        value: counts.live + greenPower + ' / ' + (counts.enabled + greenPower),
        detail:
          (notLive === 0 ? t('dashboard.kpi.devices.all') : t('dashboard.kpi.devices.notlive', { count: notLive })) +
          (counts.disabled ? ' · ' + t('dashboard.kpi.devices.disabled', { count: counts.disabled }) : '') +
          (greenPower ? ' · ' + t('dashboard.kpi.devices.greenpower', { count: greenPower }) : ''),
        tone: devicesTone(counts)
      },
      {
        filter: 'attention',
        label: t('device.byname.filter.attention'),
        value: String(attention),
        detail: reasons.map(reason => t(reason.label) + ': ' + reason.count).join(' · '),
        tone: notReachable ? 'danger' : attention ? 'warning' : 'success'
      },
      {
        filter: 'lowbattery',
        label: t('device.byname.filter.lowbattery'),
        value: String(lowBattery),
        detail: t('device.byname.fig.lowbattery', {
          count: enabled.filter(row => row.battery !== null).length,
          limit: LOW_BATTERY
        }),
        tone: lowBattery ? 'warning' : 'success'
      },
      {
        filter: 'weaklink',
        label: t('device.byname.filter.weaklink'),
        value: String(weakLink),
        detail: t('device.byname.fig.weaklink', { limit: WEAK_LQI }),
        tone: weakLink ? 'warning' : 'success'
      },
      {
        filter: 'notoptimized',
        label: t('dashboard.optimized.title'),
        value: enabled.length - notOptimized + ' / ' + enabled.length,
        detail: t('device.byname.fig.optimized', { count: notOptimized }),
        tone: notOptimized ? 'warning' : 'success'
      }
    ];
  }

  private toRow(device: DeviceByName): DeviceRow {
    if (device.GreenPower) {
      return this.toGreenPowerRow(device);
    }
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
    const statusWarning = pairingProblem(device);
    const disabled = isDisabled(device);
    const healthRank = HEALTH_RANK[device.Health ?? ''] ?? HEALTH_RANK.unknown;
    return {
      greenPower: false,
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
      healthTone: healthTone(device.Health),
      statusWarning,
      paramCount: this.paramKeys(device.Param).filter(key => key !== 'Disabled').length,
      disabled,
      // LQI 0 is no reading; a device not heard is counted for that
      weakLink: deviceState(device) === 'live' && Number(device.LQI) > 0 && Number(device.LQI) < WEAK_LQI,
      attention: !disabled && (isNotHeard(deviceState(device)) || lowBattery || statusWarning !== ''),
      removable: consistency === 'not in DZ' || consistency === 'Bad Pairing' || (device.WidgetList ?? []).length === 0
    };
  }

  /** A Green Power device: never polled, no battery reading, no Param; sorted with the unknown health. */
  private toGreenPowerRow(device: DeviceByName): DeviceRow {
    return {
      device,
      name: device.Model || device._NwkId,
      widgetCount: (device.WidgetList ?? []).length,
      router: false,
      mains: false,
      battery: null,
      lowBattery: false,
      powerSort: -1,
      lqi: Number(device.LQI) || 0,
      healthRank: HEALTH_RANK.unknown,
      healthTone: healthTone(''),
      statusWarning: '',
      paramCount: 0,
      disabled: false,
      weakLink: false,
      attention: false,
      // Only without widgets: a Green Power device with widgets goes with its last widget, in Domoticz
      removable: (device.WidgetList ?? []).length === 0,
      greenPower: true
    };
  }

  /** Top-level keys of the device Param; a Param the editor cannot read still counts its quoted keys. */
  private paramKeys(param: string): string[] {
    const parsed = parsePluginParam(param);
    return parsed.values
      ? Object.keys(parsed.values)
      : [...String(param ?? '').matchAll(/['"]([^'"]+)['"]\s*:/g)].map(match => match[1]);
  }
}
