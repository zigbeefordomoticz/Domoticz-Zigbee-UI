import { Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { ZgpModel } from '@app/shared/models/zgp-pairing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { whenSeen } from './device-details.component';

// GP Device IDs (Green Power specification), as the plugin's rest_GreenPower.GP_DEVICE_IDS
const GP_DEVICE_IDS: { [id: number]: string } = {
  0x00: 'Simple Generic 1-state Switch',
  0x01: 'Simple Generic 2-state Switch',
  0x02: 'On/Off Switch',
  0x03: 'Level Control Switch',
  0x04: 'Simple Sensor',
  0x05: 'Advanced Generic 1-state Switch',
  0x06: 'Advanced Generic 2-state Switch',
  0x07: 'Generic Switch',
  0x10: 'Color Dimmer Switch',
  0x11: 'Light Sensor',
  0x12: 'Occupancy Sensor',
  0x20: 'Door Lock Controller',
  0x30: 'Temperature Sensor',
  0x31: 'Pressure Sensor',
  0x32: 'Flow Sensor',
  0x33: 'Indoor Environment Sensor',
  0xfe: 'Manufacturer specific'
};

// GP security levels (Green Power specification)
const SECURITY_LEVELS: { [level: number]: string } = {
  0: 'device.gp.security.none',
  1: 'device.gp.security.short',
  2: 'device.gp.security.full',
  3: 'device.gp.security.encrypted'
};

export type GreenPowerDetailsAction = 'remove' | 'type';

/**
 * Details of one Green Power device (GPD), from the plugin's store (/zgp-device-raw/<ieee>; the security key is
 * never sent). A GPD without widgets, one no configuration matched, can be given a device type of /zgp-models (its
 * widgets are created at the next heartbeat) or removed; one with widgets goes with its last widget, in Domoticz.
 * Closes with 'remove' for the table to confirm and act on, or 'type' once the plugin accepted the type.
 */
@Component({
  selector: 'app-green-power-details',
  templateUrl: './green-power-details.component.html',
  styleUrls: ['./device-details.component.scss'],
  standalone: false
})
export class GreenPowerDetailsComponent implements OnInit {
  @Input() device: DeviceByName;
  // Remove and the device type close the window for Device Management to act on
  @Input() actions = true;

  loading = true;
  failed = false;
  record: any = null;
  models: ZgpModel[] = [];
  model = '';
  saving = false;

  constructor(
    public modal: NgbActiveModal,
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit() {
    this.apiService.getRawZgpDevice(this.device.IEEE).subscribe(record => {
      this.loading = false;
      this.record = record && typeof record === 'object' && Object.keys(record).length ? record : null;
      this.failed = this.record === null;
    });
    this.apiService.getZgpModels().subscribe(models => {
      this.models = Array.isArray(models) ? models : [];
    });
  }

  get title(): string {
    return this.device.Model || this.device._NwkId;
  }

  /** Source ID, as the table shows it (0x015B0314). */
  get srcId(): string {
    return this.device._NwkId;
  }

  get widgets(): string[] {
    return Array.isArray(this.record?.WidgetList) ? this.record.WidgetList : (this.device.WidgetList ?? []);
  }

  get hasWidgets(): boolean {
    return this.widgets.length > 0;
  }

  get deviceType(): string {
    const id = this.record?.device_id;
    if (typeof id !== 'number') {
      return '—';
    }
    return '0x' + this.hex(id, 2) + ' ' + (GP_DEVICE_IDS[id] ?? this.translate.instant('device.gp.unknown'));
  }

  get manufacturer(): string {
    const manufacturer = this.record?.manufacturer_id;
    const model = this.record?.model_id;
    if (typeof manufacturer !== 'number' && typeof model !== 'number') {
      return '';
    }
    return [manufacturer, model]
      .map(value => (typeof value === 'number' ? '0x' + this.hex(value, 4) : '—'))
      .join(' / ');
  }

  get commands(): string {
    const commands = Array.isArray(this.record?.commands) ? this.record.commands : [];
    return commands.map((command: number) => '0x' + this.hex(command, 2)).join(' ');
  }

  get security(): string {
    const level = this.record?.security_level;
    return typeof level === 'number' && SECURITY_LEVELS[level] ? this.translate.instant(SECURITY_LEVELS[level]) : '—';
  }

  get commissioned() {
    return this.when(this.record?.Commissioned);
  }

  get lastHeard() {
    return this.when(this.record?.LastSeen);
  }

  /** The description of a device type of /zgp-models, its name when unknown. */
  modelLabel(name: string): string {
    return this.models.find(model => model.Name === name)?.Description || name;
  }

  setType() {
    if (!this.model || this.saving) {
      return;
    }
    this.saving = true;
    this.apiService.putZgpDeviceModel(this.device.IEEE, this.model).subscribe({
      next: () => {
        this.toastr.success(this.translate.instant('device.gp.type.set', { type: this.modelLabel(this.model) }));
        this.modal.close('type');
      },
      error: () => (this.saving = false)
    });
  }

  close(action: GreenPowerDetailsAction) {
    this.modal.close(action);
  }

  private hex(value: number, digits: number): string {
    return value.toString(16).toUpperCase().padStart(digits, '0');
  }

  private when(seconds: unknown): { date: string; ago: string } | null {
    return whenSeen(seconds, this.translate.currentLang || this.locale);
  }
}
