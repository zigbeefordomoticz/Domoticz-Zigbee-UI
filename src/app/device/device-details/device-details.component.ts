import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input, OnInit } from '@angular/core';
import { resolveDeviceType } from '@app/network/mesh/mesh-device-type';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { decodeNodeDescriptor, NodeDescriptor, rollingLqi, rollingRssi } from './node-descriptor';

// Where Blakadder takes a device it does not list yet
const BLAKADDER_NEW = 'https://zigbee.blakadder.com/new.html';

const PROFILES: { [id: string]: string } = { '0104': 'Home Automation', c05e: 'Light Link', a1e0: 'Green Power' };

// Signal chart geometry (SVG user units): a low strip, thin bars centred in their slot
const CHART_WIDTH = 300;
const CHART_HEIGHT = 40;
const BAR_WIDTH = 12;
const SLOTS = 10;

export type DetailsAction = 'parameters' | 'remove';

/** A note from the model configuration: text, or a link when the value is a URL. */
interface ConfNote {
  text: string;
  url?: string;
  lead?: boolean;
}

type SignalKind = 'rssi' | 'lqi';

// Bar scale and colour thresholds: RSSI in dBm (-100 to 0), LQI 0-255 as the table
const SIGNAL: { [kind in SignalKind]: { floor: number; ceiling: number; good: number; fair: number } } = {
  rssi: { floor: -100, ceiling: 0, good: -65, fair: -80 },
  lqi: { floor: 0, ceiling: 255, good: 100, fair: 40 }
};

interface SignalBar {
  path: string;
  value: number;
  tone: string;
}

/** One chart: the last readings of RollingLQI or RollingRSSI. */
interface SignalChart {
  kind: SignalKind;
  values: number[];
  bars: SignalBar[];
  // Heights of the fair and good thresholds, drawn as dashed lines
  thresholds: number[];
  latest: number;
  min: number;
  max: number;
  range: string;
}

/**
 * Details of one device: what /zdevice-name already gave the table, plus the plugin's record from
 * /zdevice-raw/<nwkid> (manufacturer, profile / device id, RollingLQI and RollingRSSI, messages received, node
 * descriptor).
 * Closes with 'parameters' or 'remove' for the table to act on.
 */
@Component({
  selector: 'app-device-details',
  templateUrl: './device-details.component.html',
  styleUrls: ['./device-details.component.scss'],
  standalone: false
})
export class DeviceDetailsComponent implements OnInit {
  @Input() device: DeviceByName;
  @Input() canRemove = false;
  // The table's Health pill tone (health-success, -warning, -danger, -secondary in theme.scss)
  @Input() healthTone = 'secondary';

  readonly chartWidth = CHART_WIDTH;
  readonly chartHeight = CHART_HEIGHT;
  loading = true;
  failed = false;
  manufacturerName = '';
  manufacturerId = '';
  profileId = '';
  profileName = '';
  deviceId = '';
  deviceLabel = '';
  deviceEndpoint = '';
  // RollingLQI (link quality the coordinator measured on the frames received from the device), always; then
  // RollingRSSI (the device RSSI zigpy reports), only when the radio library fills it
  charts: SignalChart[] = [];
  descriptor: NodeDescriptor | null = null;
  // ZDO / ZCL frames received since the plugin start; null when the plugin does not count them (older plugin)
  received: { zdo: number; zcl: number } | null = null;
  // _description, _comment of the model configuration (plugin "DeviceConfInfo", absent before it)
  notes: ConfNote[] = [];
  // The device's Blakadder page from the same notes; { } when it has none; null without DeviceConfInfo (older plugin)
  blakadder: { url?: string; text?: string } | null = null;
  readonly blakadderNew = BLAKADDER_NEW;

  constructor(
    public modal: NgbActiveModal,
    private apiService: ApiService,
    private clipboard: Clipboard,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getRawZDevice(this.device._NwkId).subscribe({
      next: answer => {
        this.read(answer?.Device);
        this.notes = this.confNotes(answer?.DeviceConfInfo);
        this.blakadder = this.blakadderPage(answer?.DeviceConfInfo);
      },
      error: () => {
        this.loading = false;
        this.failed = true;
      }
    });
  }

  /**
   * "0x1021" when the plugin holds the 4-hex manufacturer code; some device modules store a name in
   * "Manufacturer" instead: shown as is, and not at all when it repeats the manufacturer name.
   */
  get manufacturerCode(): string {
    const id = this.manufacturerId.trim();
    if (/^[0-9a-f]{4}$/i.test(id)) {
      return '0x' + id.toLowerCase();
    }
    return id.toLowerCase() === this.manufacturerName.trim().toLowerCase() ? '' : id;
  }

  get title(): string {
    return this.device.ZDeviceName || this.device.Model || this.device._NwkId;
  }

  copy() {
    this.apiService.getNonOptimizedDevice(this.device._NwkId).subscribe(json => {
      this.clipboard.copy(JSON.stringify(json));
      this.toastr.success(this.translate.instant('device.details.copied'));
    });
  }

  close(action: DetailsAction) {
    this.modal.close(action);
  }

  private read(record: any) {
    this.loading = false;
    if (!record || typeof record !== 'object') {
      this.failed = true;
      return;
    }
    this.manufacturerName = this.text(record['Manufacturer Name']);
    this.manufacturerId = this.text(record.Manufacturer);

    const type = resolveDeviceType({
      nwkid: this.device._NwkId,
      zdeviceId: record.ZDeviceID,
      profileId: record.ProfileID,
      endpoints: record.Epv2
    });
    if (type) {
      this.profileId = type.profileId;
      this.profileName = PROFILES[type.profileId] ?? '';
      this.deviceId = type.id;
      this.deviceLabel = type.label ?? '';
      this.deviceEndpoint = type.endpoint ?? '';
    }

    this.charts = [this.signalChart('lqi', rollingLqi(record.RollingLQI))];
    const rssi = rollingRssi(record.RollingRSSI);
    if (rssi.length) {
      this.charts.push(this.signalChart('rssi', rssi));
    }
    this.descriptor = decodeNodeDescriptor(record._rawNodeDescriptor);
    if (typeof record.ReceivedZDO === 'number' || typeof record.ReceivedZCL === 'number') {
      this.received = { zdo: this.count(record.ReceivedZDO), zcl: this.count(record.ReceivedZCL) };
    }
  }

  /** Description first, then the comment; a value repeated is shown once. Blakadder pages have their own line. */
  private confNotes(info: unknown): ConfNote[] {
    if (!info || typeof info !== 'object') {
      return [];
    }
    const notes: ConfNote[] = [];
    const seen = new Set<string>();
    const add = (value: unknown, lead = false) => {
      const text = (Array.isArray(value) ? value.join('\n') : typeof value === 'string' ? value : '').trim();
      if (!text || seen.has(text) || this.isBlakadder(text)) {
        return;
      }
      seen.add(text);
      notes.push(/^https?:\/\/\S+$/.test(text) ? { text: this.linkText(text), url: text } : { text, lead });
    };
    const values = info as { [key: string]: unknown };
    add(values._description, true);
    add(values._comment);
    return notes;
  }

  /** The Blakadder page named in the notes: _blakadder, or a _comment / _description that is that URL. */
  private blakadderPage(info: unknown): { url?: string; text?: string } | null {
    if (!info || typeof info !== 'object') {
      return null;
    }
    const values = info as { [key: string]: unknown };
    const url = [values._blakadder, values._comment, values._description]
      .map(value => (typeof value === 'string' ? value.trim() : ''))
      .find(value => this.isBlakadder(value));
    return url ? { url, text: this.linkText(url) } : {};
  }

  private isBlakadder(text: string): boolean {
    if (!/^https?:\/\/\S+$/.test(text)) {
      return false;
    }
    const host = new URL(text).hostname;
    return host === 'blakadder.com' || host.endsWith('.blakadder.com');
  }

  /** "zigbee.blakadder.com › Philips_8718699673147": the site, and which page of it. */
  private linkText(url: string): string {
    const { hostname, pathname } = new URL(url);
    const page = decodeURIComponent(pathname.replace(/\/+$/, '').split('/').pop() ?? '').replace(/\.html?$/, '');
    return page ? `${hostname} › ${page}` : hostname;
  }

  private signalChart(kind: SignalKind, values: number[]): SignalChart {
    const scale = SIGNAL[kind];
    return {
      kind,
      values,
      bars: this.signalBars(values, scale),
      thresholds: [scale.fair, scale.good].map(value => CHART_HEIGHT - this.barHeight(value, scale)),
      latest: values[values.length - 1],
      min: Math.min(...values),
      max: Math.max(...values),
      range: kind === 'rssi' ? `${scale.floor} – ${scale.ceiling} dBm` : `${scale.floor}–${scale.ceiling}`
    };
  }

  /** One bar per reading, oldest left; the slots of missing readings stay empty on the left. */
  private signalBars(values: number[], scale: (typeof SIGNAL)[SignalKind]): SignalBar[] {
    const slot = CHART_WIDTH / SLOTS;
    const offset = SLOTS - values.length;
    return values.map((value, index) => {
      const height = Math.max(2, this.barHeight(value, scale));
      const x = (offset + index) * slot + (slot - BAR_WIDTH) / 2;
      const width = BAR_WIDTH;
      const y = CHART_HEIGHT - height;
      // Rounded at the data end only, square on the baseline
      const r = Math.min(2, width / 2, height);
      return {
        path:
          `M${x},${CHART_HEIGHT} V${y + r} Q${x},${y} ${x + r},${y} ` +
          `H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${CHART_HEIGHT} Z`,
        value,
        tone: value >= scale.good ? 'good' : value >= scale.fair ? 'fair' : 'poor'
      };
    });
  }

  /** Height of a value on the chart, the full scale (floor to ceiling) kept so devices compare. */
  private barHeight(value: number, scale: (typeof SIGNAL)[SignalKind]): number {
    return Math.min(1, Math.max(0, (value - scale.floor) / (scale.ceiling - scale.floor))) * CHART_HEIGHT;
  }

  private count(value: unknown): number {
    return typeof value === 'number' ? value : 0;
  }

  // The plugin stores {} or "" for a field never received
  private text(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
}
