import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input, OnInit } from '@angular/core';
import { resolveDeviceType } from '@app/network/mesh/mesh-device-type';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { decodeNodeDescriptor, NodeDescriptor, rollingLqi } from './node-descriptor';

const PROFILES: { [id: string]: string } = { '0104': 'Home Automation', c05e: 'Light Link', a1e0: 'Green Power' };

// LQI chart geometry (SVG user units); bars are drawn on a 0-255 scale
const CHART_WIDTH = 300;
const CHART_HEIGHT = 96;
const BAR_GAP = 2;
const SLOTS = 10;

export type DetailsAction = 'parameters' | 'remove';

interface LqiBar {
  path: string;
  value: number;
  tone: string;
}

/**
 * Details of one device: what /zdevice-name already gave the table, plus the plugin's record from
 * /zdevice-raw/<nwkid> (manufacturer, profile / device id, RollingLQI, node descriptor).
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
  lqi: number[] = [];
  bars: LqiBar[] = [];
  descriptor: NodeDescriptor | null = null;

  constructor(
    public modal: NgbActiveModal,
    private apiService: ApiService,
    private clipboard: Clipboard,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getRawZDevice(this.device._NwkId).subscribe({
      next: answer => this.read(answer?.Device),
      error: () => {
        this.loading = false;
        this.failed = true;
      }
    });
  }

  get title(): string {
    return this.device.ZDeviceName || this.device.Model || this.device._NwkId;
  }

  get lqiLatest(): number {
    return this.lqi[this.lqi.length - 1];
  }

  get lqiMin(): number {
    return Math.min(...this.lqi);
  }

  get lqiMax(): number {
    return Math.max(...this.lqi);
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

    this.lqi = rollingLqi(record.RollingLQI);
    this.bars = this.lqiBars(this.lqi);
    this.descriptor = decodeNodeDescriptor(record._rawNodeDescriptor);
  }

  /** One bar per reading, oldest left; the slots of missing readings stay empty on the left. */
  private lqiBars(values: number[]): LqiBar[] {
    const slot = CHART_WIDTH / SLOTS;
    const offset = SLOTS - values.length;
    return values.map((value, index) => {
      const height = Math.max(2, (value / 255) * CHART_HEIGHT);
      const x = (offset + index) * slot + BAR_GAP / 2;
      const width = slot - BAR_GAP;
      const y = CHART_HEIGHT - height;
      // Rounded at the data end only, square on the baseline
      const r = Math.min(4, width / 2, height);
      return {
        path:
          `M${x},${CHART_HEIGHT} V${y + r} Q${x},${y} ${x + r},${y} ` +
          `H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${CHART_HEIGHT} Z`,
        value,
        tone: value >= 100 ? 'good' : value >= 40 ? 'fair' : 'poor'
      };
    });
  }

  // The plugin stores {} or "" for a field never received
  private text(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }
}
