import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { BindingTable, BindingTableEntry } from '@app/shared/models/binding';
import { Configure, Info } from '@app/shared/models/configure-reporting';
import { ZDevices } from '@app/shared/models/device';
import { DeviceBind } from '@app/shared/models/device-bind';
import { Plugin } from '@app/shared/models/plugin';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';

// Hex digits of the "Change" threshold per ZCL data type (from the former reporting editor); 10 is a boolean
const CHANGE_DIGITS: Record<string, number> = {
  '10': 1,
  '20': 2,
  '21': 4,
  '22': 6,
  '23': 8,
  '24': 10,
  '25': 12,
  '26': 14,
  '27': 16,
  '28': 2,
  '29': 4,
  '2a': 6,
  '2b': 8,
  '2c': 10,
  '2d': 12,
  '2e': 14,
  '2f': 16,
  '38': 4,
  '39': 8,
  '3a': 16,
  e0: 8,
  e1: 8,
  e2: 8
};
const MAX_INTERVAL = 0xffff;

interface Binding {
  label: string;
  ep: string;
  destIeee: string | null;
}

interface ReportRow {
  attribute: string;
  info: Info;
  original: Info;
}

interface ClusterRow {
  ep: string;
  id: string;
  name: string;
  bindings: Binding[];
  reports: ReportRow[];
}

/**
 * Tools → Binding / Reporting, device first: for each endpoint and cluster of the device, what it is bound
 * to (from its binding table) and, on zigpy radios, how its attributes report.
 *
 * Binding table: /binding-table-req asks the device, the plugin stores the answer, /binding-table-disp
 * reads it. Reporting: /cfgrpt-ondemand-config/<nwkid> (min / max intervals and change in hex, the change
 * as long as its data type), saved whole with PUT; /cfgrpt-ondemand sends it to the device again.
 */
@Component({
  selector: 'app-binding',
  templateUrl: './binding.component.html',
  styleUrls: ['./binding.component.scss'],
  standalone: false
})
export class BindingComponent implements OnInit {
  @ViewChild('panel') panelRef: ElementRef<HTMLElement>;

  plugin: Plugin;
  devices: ZDevices[] = [];
  search = '';
  device: ZDevices = null;
  rows: ClusterRow[] = [];
  table: BindingTable = null;
  reporting: Configure[] = null;
  bindable = new Set<string>();
  coordinatorIeee: string = null;
  loading = false;

  adding: ClusterRow = null;
  targets: DeviceBind[] = [];
  target: DeviceBind = null;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getPlugin().subscribe(plugin => (this.plugin = plugin));
    this.apiService.getCoordinator().subscribe(coordinator => (this.coordinatorIeee = coordinator?.IEEE ?? null));
    this.apiService
      .getBindLSTcluster()
      .subscribe(clusters => (this.bindable = new Set((clusters ?? []).map(cluster => cluster.ClusterId))));
    this.apiService.getZDevices().subscribe(devices => {
      this.devices = (devices ?? [])
        .filter(device => device._NwkId !== '0000' && device.LogicalType !== 'Coordinator')
        .sort((a, b) => (a.ZDeviceName || a._NwkId).localeCompare(b.ZDeviceName || b._NwkId));
    });
  }

  get shown(): ZDevices[] {
    const text = this.search.trim().toLowerCase();
    return text
      ? this.devices.filter(device =>
          [device.ZDeviceName, device._NwkId, device.Model].some(value => value?.toLowerCase().includes(text))
        )
      : this.devices;
  }

  get zigpy(): boolean {
    return !!this.plugin?.Zigpy;
  }

  get changes(): number {
    return this.rows.reduce((count, row) => count + row.reports.filter(report => this.changed(report)).length, 0);
  }

  get valid(): boolean {
    return this.rows.every(row => row.reports.every(report => this.reportValid(report)));
  }

  select(device: ZDevices) {
    this.device = device;
    this.adding = null;
    this.table = null;
    this.reporting = null;
    this.rows = [];
    this.loading = true;
    this.readTable();
    if (this.zigpy) {
      this.apiService.getConfigureReporting(device._NwkId).subscribe(config => {
        this.reporting = Array.isArray(config) ? config : [];
        this.build();
      });
    }
    this.build();
    // On a phone the device comes after the whole list: bring it into sight
    setTimeout(() => {
      const panel = this.panelRef?.nativeElement;
      if (panel && panel.getBoundingClientRect().top > window.innerHeight) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // Asks the device, then reads what the plugin stored a few seconds later
  requestTable() {
    const nwkId = this.device._NwkId;
    this.apiService.getBindingTableRequest(nwkId).subscribe(() => {
      this.toastr.success(this.translate.instant('tools.bind.table.asked'));
      timer(3000, 5000)
        .pipe(take(3))
        .subscribe({
          next: () => {
            if (this.device?._NwkId === nwkId) {
              this.readTable();
            }
          }
        });
    });
  }

  startBind(row: ClusterRow) {
    this.adding = row;
    this.target = null;
    this.targets = [];
    this.apiService.getBindLSTdevice(row.id).subscribe(devices => {
      this.targets = (devices ?? []).filter(device => device.NwkId !== this.device._NwkId);
    });
  }

  bind() {
    const row = this.adding;
    this.apiService
      .putBinding({
        sourceIeee: this.device.IEEE,
        sourceEp: row.ep,
        destIeee: this.target.IEEE,
        destEp: this.target.Ep,
        cluster: row.id
      })
      .subscribe(() => {
        this.toastr.success(this.translate.instant('tools.bind.bound'));
        this.adding = null;
      });
  }

  unbind(row: ClusterRow, binding: Binding) {
    this.apiService
      .putUnBinding({
        sourceIeee: this.device.IEEE,
        sourceEp: row.ep,
        destIeee: binding.destIeee,
        destEp: binding.ep,
        cluster: row.id
      })
      .subscribe(() => {
        this.toastr.success(this.translate.instant('tools.bind.unbound'));
        row.bindings = row.bindings.filter(item => item !== binding);
      });
  }

  // Decimal shown, hex stored
  value(report: ReportRow, field: keyof Info): string {
    const raw = report.info[field];
    const number = parseInt(raw, 16);
    return isNaN(number) ? '' : String(number);
  }

  setValue(report: ReportRow, field: keyof Info, text: string) {
    const number = Number(text);
    if (text === '' || !Number.isInteger(number) || number < 0) {
      report.info[field] = 'invalid';
      return;
    }
    if (field === 'Change') {
      const digits = CHANGE_DIGITS[report.info.DataType.toLowerCase()] ?? 0;
      report.info.Change = digits ? number.toString(16).toUpperCase().padStart(digits, '0') : number.toString(16);
    } else {
      report.info[field] = number.toString(16).toUpperCase();
    }
  }

  changeEditable(report: ReportRow): boolean {
    return (CHANGE_DIGITS[report.info.DataType?.toLowerCase()] ?? 0) > 1;
  }

  changed(report: ReportRow): boolean {
    return (['MinInterval', 'MaxInterval', 'Change'] as (keyof Info)[]).some(
      field =>
        parseInt(report.info[field], 16) !== parseInt(report.original[field], 16) || report.info[field] === 'invalid'
    );
  }

  reportValid(report: ReportRow): boolean {
    const min = parseInt(report.info.MinInterval, 16);
    const max = parseInt(report.info.MaxInterval, 16);
    const change = parseInt(report.info.Change, 16);
    const digits = CHANGE_DIGITS[report.info.DataType?.toLowerCase()] ?? 0;
    const changeMax = digits ? 16 ** digits - 1 : Infinity;
    return (
      !isNaN(min) &&
      !isNaN(max) &&
      min <= MAX_INTERVAL &&
      max <= MAX_INTERVAL &&
      (isNaN(change) ? !this.changeEditable(report) : change <= (digits === 1 ? 1 : changeMax))
    );
  }

  saveReporting() {
    this.apiService.putConfigureReporting(this.device._NwkId, this.reporting).subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
      this.rows.forEach(row => row.reports.forEach(report => (report.original = { ...report.info })));
    });
  }

  discard() {
    this.rows.forEach(row => row.reports.forEach(report => Object.assign(report.info, report.original)));
  }

  sendReporting() {
    this.apiService
      .getTriggerConfigureReporting(this.device._NwkId)
      .subscribe(() => this.toastr.success(this.translate.instant('tools.bind.report.sent')));
  }

  resetReporting() {
    this.apiService.deleteConfigureReporting(this.device._NwkId).subscribe(() => {
      this.toastr.success(this.translate.instant('tools.bind.report.reset'));
      this.select(this.device);
    });
  }

  private readTable() {
    const nwkId = this.device._NwkId;
    this.apiService.getBindingTable(nwkId).subscribe(table => {
      if (this.device?._NwkId !== nwkId) {
        return;
      }
      this.table = table && typeof table === 'object' && Array.isArray(table.Devices) ? table : null;
      this.loading = false;
      this.build();
    });
  }

  // Endpoint × cluster rows: bindable clusters of the device, plus any cluster with a binding or a report
  private build() {
    if (!this.device) {
      return;
    }
    const rows: ClusterRow[] = [];
    const rowFor = (ep: string, id: string, name = '') => {
      let row = rows.find(item => item.ep === ep && item.id === id);
      if (!row) {
        row = { ep, id, name, bindings: [], reports: [] };
        rows.push(row);
      }
      if (name && !row.name) {
        row.name = name;
      }
      return row;
    };
    (this.device.Ep ?? []).forEach(ep =>
      (ep.ClusterList ?? []).forEach((cluster: Record<string, string>) => {
        const [id, name] = Object.entries(cluster)[0] ?? [];
        if (id && this.bindable.has(id)) {
          rowFor(ep.Ep, id, name);
        }
      })
    );
    const seen = new Set<string>();
    (this.table?.Devices ?? []).forEach(record => {
      const entry: BindingTableEntry = Object.values(record)[0];
      if (!entry?.Cluster) {
        return;
      }
      const key = JSON.stringify(entry);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      rowFor(entry.sourceEp, entry.Cluster).bindings.push(this.describe(entry));
    });
    // Reporting has no endpoint: shown under the first endpoint holding the cluster
    (this.reporting ?? []).forEach(cluster => {
      const holder = rows.find(row => row.id === cluster.ClusterId);
      const row = holder ?? rowFor(this.device.Ep?.[0]?.Ep ?? '01', cluster.ClusterId);
      (cluster.Attributes ?? []).forEach(attribute => {
        const info = attribute.Infos?.[0];
        if (info) {
          row.reports.push({ attribute: attribute.Attribute, info, original: { ...info } });
        }
      });
    });
    this.rows = rows
      .filter(row => this.bindable.has(row.id) || row.bindings.length || row.reports.length)
      .sort((a, b) => a.ep.localeCompare(b.ep) || a.id.localeCompare(b.id));
  }

  private describe(entry: BindingTableEntry): Binding {
    if (entry.targetGroupId) {
      return { label: this.translate.instant('tools.bind.group', { id: entry.targetGroupId }), ep: '', destIeee: null };
    }
    const device = this.devices.find(item => item._NwkId === entry.targetNwkId || item.IEEE === entry.targetIEEE);
    const coordinator =
      entry.targetNwkId === '0000' || (!!entry.targetIEEE && entry.targetIEEE === this.coordinatorIeee?.toLowerCase());
    const name = coordinator
      ? this.translate.instant('tools.bind.coordinator')
      : entry.targetNickName || device?.ZDeviceName || entry.targetNwkId || entry.targetIEEE;
    return { label: name, ep: entry.targetEp ?? '', destIeee: entry.targetIEEE ?? device?.IEEE ?? null };
  }
}
