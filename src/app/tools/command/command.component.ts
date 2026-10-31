import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { Capabilities } from '@app/shared/models/capabilities';
import { ZDevices } from '@app/shared/models/device';
import { Plugin } from '@app/shared/models/plugin';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

// Types /dev-cap may list, and the controls drawn for each (rest_dev_capabilities on stable9)
const SWITCH_TYPES = ['Switch', 'LivoloSWL', 'LivoloSWR'];
const COLOR_TYPES = ['ColorControlRGBWW', 'ColorControlWW', 'ColorControlRGB'];

interface SentCommand {
  time: Date;
  device: string;
  text: string;
  ok: boolean;
}

/**
 * Tools → Command: pick a device, then use the commands the plugin offers for it (/dev-cap), grouped
 * by the widget type they act on, or send a raw Zigbee frame to it (zigpy radios).
 *
 * /dev-command reads Value as hex whenever it is made of hex digits only (is_hex(str(Value)) on
 * stable9), so a level 60 sent as "60" became 0x60 = 96. Every number is sent here in hex
 * ("3c" for 60), which the plugin reads right whatever it tries first.
 */
@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss'],
  standalone: false
})
export class CommandComponent implements OnInit {
  @ViewChild('panel') panelRef: ElementRef<HTMLElement>;

  plugin: Plugin;
  devices: ZDevices[] = [];
  search = '';
  device: ZDevices = null;
  capabilities: Capabilities = null;
  sent: SentCommand[] = [];

  level = 50;
  cover = 50;
  setpoint = 20;
  color = '#ffd9a0';
  brightness = 80;
  effect = '00';
  powerOn = '01';

  raw = {
    ProfileId: '0104',
    ClusterId: '0006',
    SourceEp: '01',
    TargetEp: '01',
    Sqn: '55',
    Payload: '',
    GroupAddressFlag: false,
    AckMode: false,
    group: ''
  };

  readonly effects = [
    { value: '00', label: 'tools.cmd.effect.blink' },
    { value: '01', label: 'tools.cmd.effect.breathe' },
    { value: '02', label: 'tools.cmd.effect.okay' },
    { value: '0b', label: 'tools.cmd.effect.channel' },
    { value: 'fe', label: 'tools.cmd.effect.finish' },
    { value: 'ff', label: 'tools.cmd.effect.stop' }
  ];

  // ZCL StartUpOnOff
  readonly powerOnModes = [
    { value: '00', label: 'tools.cmd.poweron.off' },
    { value: '01', label: 'tools.cmd.poweron.on' },
    { value: '02', label: 'tools.cmd.poweron.toggle' },
    { value: 'ff', label: 'tools.cmd.poweron.previous' }
  ];

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getPlugin().subscribe(plugin => (this.plugin = plugin));
    this.apiService.getZDevices().subscribe(devices => {
      this.devices = (devices ?? [])
        .filter(device => device._NwkId !== '0000' && device.LogicalType !== 'Coordinator')
        .sort(
          (a, b) =>
            Number(b.LogicalType === 'Router') - Number(a.LogicalType === 'Router') ||
            (a.ZDeviceName || a._NwkId).localeCompare(b.ZDeviceName || b._NwkId)
        );
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

  get switchTypes(): string[] {
    return this.types.filter(type => SWITCH_TYPES.includes(type));
  }

  get colorTypes(): string[] {
    return this.types.filter(type => COLOR_TYPES.includes(type));
  }

  hasType(type: string): boolean {
    return this.types.includes(type);
  }

  get noCommand(): boolean {
    return !!this.capabilities && !this.capabilities.Capabilities?.length;
  }

  has(actuator: string): boolean {
    return (this.capabilities?.Capabilities ?? []).some(capability => capability.actuator === actuator);
  }

  select(device: ZDevices) {
    this.device = device;
    this.capabilities = null;
    this.raw.TargetEp = device.Ep?.[0]?.Ep ?? '01';
    // On a phone the commands come after the whole list: bring them into sight
    setTimeout(() => {
      const panel = this.panelRef?.nativeElement;
      if (panel && panel.getBoundingClientRect().top > window.innerHeight) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    this.apiService.getDevCap(device._NwkId).subscribe(capabilities => (this.capabilities = capabilities));
  }

  send(command: string, type: string | null, value: number | string | null = null, color: string | null = null) {
    const body: any = {
      NwkId: this.device._NwkId,
      Command: command,
      Value: typeof value === 'number' ? Math.round(value).toString(16) : value,
      Color: color
    };
    // Without Type the plugin acts on endpoint 01 as a Switch; with null it looks for the Identify cluster
    body.Type = type;
    const text = [command, type, value !== null ? String(value) : null, color].filter(part => part).join(' · ');
    this.track(this.apiService.putDevCommand(body), text);
  }

  sendColor(type: string) {
    const hex = this.color.replace('#', '');
    const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
    this.send('SetColor', type, this.brightness, `rgb(${r},${g},${b})`);
  }

  sendRaw() {
    const body = {
      TargetAddr: this.raw.GroupAddressFlag ? this.raw.group : this.device._NwkId,
      GroupAddressFlag: this.raw.GroupAddressFlag,
      AckMode: this.raw.AckMode,
      ProfileId: this.raw.ProfileId,
      ClusterId: this.raw.ClusterId,
      SourceEp: this.raw.SourceEp,
      TargetEp: this.raw.TargetEp,
      Sqn: this.raw.Sqn,
      Payload: this.raw.Payload
    };
    const text = `raw ${body.ProfileId} / ${body.ClusterId} · ${body.TargetAddr} ep ${body.TargetEp} · ${body.Payload}`;
    this.track(this.apiService.putCommandRawZigpy(body as any), text);
  }

  get rawValid(): boolean {
    const hex = (value: string) => /^[0-9A-Fa-f]+$/.test(value ?? '');
    return (
      ['ProfileId', 'ClusterId', 'SourceEp', 'TargetEp', 'Sqn', 'Payload'].every(key => hex((this.raw as any)[key])) &&
      (!this.raw.GroupAddressFlag || hex(this.raw.group))
    );
  }

  private get types(): string[] {
    return this.capabilities?.Types ?? [];
  }

  private track(request: Observable<any>, text: string) {
    const entry: SentCommand = {
      time: new Date(),
      device: this.device.ZDeviceName || this.device._NwkId,
      text,
      ok: true
    };
    request.subscribe({
      next: () => {
        this.sent.unshift(entry);
        this.toastr.success(this.translate.instant('api.global.succes.commandsent.notify'));
      },
      error: () => this.sent.unshift({ ...entry, ok: false })
    });
  }
}
