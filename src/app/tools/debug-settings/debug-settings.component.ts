import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { Setting, Settings } from '@app/shared/models/setting';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

// Logging modules of the plugin (VerboseLogging in PluginConf.py) sorted for people; anything not
// listed lands in "Other", so a module added by the plugin still shows
const CATEGORIES: { key: string; modules: string[] }[] = [
  {
    key: 'options',
    modules: [
      'enablePluginLogging',
      'logDeviceUpdate',
      'logThreadName',
      'ZigpyDefaultLoggingInfo',
      'trackTransportError',
      'trackZclClustersIn',
      'trackZclClustersOut',
      'trackZdpClustersIn',
      'trackZdpClustersOut',
      'showTimeOutMsg',
      'enableStructuredDeviceTrace'
    ]
  },
  {
    key: 'devices',
    modules: [
      'Pairing',
      'DeviceAnnoucement',
      'WidgetCreation',
      'Widget',
      'WidgetUpdate',
      'WidgetLevel3',
      'WidgetReset',
      'DeviceParameter',
      'Database',
      'Heartbeat',
      'ReadAttributes',
      'ReadAttributeMaxAttributes',
      'WriteAttributes',
      'ConfigureReporting',
      'Binding',
      'BatteryManagement',
      'CustomDevicePolling',
      'PollControl',
      'Groups',
      'OTA',
      'z4dCertifiedDevices'
    ]
  },
  {
    key: 'messages',
    modules: [
      'Cluster',
      'ZclClusters',
      'zclCommand',
      'zclDecoder',
      'zclDefaultResponse',
      'zdpCommand',
      'zdpDecoder',
      'inRawAPS',
      'outRawAPS',
      'Command',
      'BasicOutput',
      'Input',
      'IAS',
      'IAS_ACE',
      'Temperature',
      'Humidity',
      'Barometer',
      'Illuminance',
      'Occupancy',
      'Electric',
      'Flow',
      'Thermostats',
      'thermoSettings',
      'thermoUISettings',
      'iasSettings',
      'occupancySettings',
      'onoffSettings',
      'tuyaSettings'
    ]
  },
  {
    key: 'radio',
    modules: [
      'Transport',
      'Transport8000',
      'Transport8002',
      'Transport8011',
      'Transport8012',
      'TransportError',
      'TransportFrwder',
      'TransportPluginEncoder',
      'TransportProto',
      'TransportRder',
      'TransportSerial',
      'TransportTcpip',
      'TransportWrter',
      'TransportZigpy',
      'TransportZigpyStack',
      'Zigpy',
      'ZigpyZNP',
      'ZigpyEZSP',
      'ZigpydeCONZ',
      'ZigpyBLZ',
      'ZigpyZigate',
      'ZigpyTopology',
      'ZigpyReactTime',
      'ZiGateReactTime',
      'ThreadCommunication',
      'ThreadDomoticz',
      'ThreadForwarder',
      'ThreadWriter',
      'coordinatorCmd',
      'zigateCommand',
      'PDM',
      'PiZigate',
      'NXPExtendedErrorCode',
      'NetworkEnergy',
      'NetworkMap'
    ]
  },
  {
    key: 'manufacturers',
    modules: [
      'CasaIA',
      'Chameleon',
      'Danfoss',
      'Enki',
      'GammaTroniques',
      'Gledopto',
      'Heiman',
      'Ikea',
      'Legrand',
      'Livolo',
      'Lumi',
      'Namron',
      'Orvibo',
      'Philips',
      'Pluzzy',
      'Profalux',
      'Schneider',
      'Sonoff',
      'Sunricher',
      'Tuya',
      'Tuya0601',
      'TuyaTS011F',
      'ZLinky',
      'ZosungIR'
    ]
  },
  {
    key: 'plugin',
    modules: [
      'Plugin',
      'PluginTools',
      'AbstractDz',
      'DZapi',
      'DNS',
      'ListImportedModules',
      'Matomo',
      'MemoryLeak',
      'StopProcess',
      'TimeServer',
      'WebServer',
      'WebUIReactTime'
    ]
  }
];

const PRESETS: { key: string; modules: string[] }[] = [
  { key: 'pairing', modules: ['Pairing', 'DeviceAnnoucement', 'WidgetCreation', 'Binding', 'ConfigureReporting'] },
  { key: 'update', modules: ['Heartbeat', 'Input', 'zclDecoder', 'ReadAttributes', 'WidgetUpdate'] },
  { key: 'radio', modules: ['TransportZigpy', 'Zigpy', 'ZigpyZNP', 'ZigpyEZSP', 'ZigpydeCONZ', 'ZigpyBLZ'] },
  { key: 'ota', modules: ['OTA'] }
];

// Not switches: shown in "Limit the log"
const LIMITS = ['MatchingNwkId', 'LQIthreshold', 'loggingBackupCount', 'loggingMaxMegaBytes'];
const ALL_DEVICES = 'ffff';

interface Category {
  key: string;
  settings: Setting[];
}

/**
 * Tools → Debug: which plugin modules write debug messages (/setting-debug, the VerboseLogging
 * settings), grouped by what they cover, with starting presets and the limits that apply to all.
 *
 * Only changed settings are sent, as on the Settings page. MatchingNwkId is the comma-separated
 * list of devices to log, "ffff" for all (LoggingManagement.loggingWriteDebug on stable9).
 */
@Component({
  selector: 'app-debug-settings',
  templateUrl: './debug-settings.component.html',
  styleUrls: ['./debug-settings.component.scss'],
  standalone: false
})
export class DebugSettingsComponent implements OnInit {
  settings: Setting[] = [];
  categories: Category[] = [];
  values: Record<string, any> = {};
  devices: DeviceByName[] = [];
  matching: string[] = [];
  search = '';
  saving = false;

  readonly presets = PRESETS;

  private initial: Record<string, any> = {};

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.load();
    this.apiService.getZDeviceName().subscribe(devices => {
      this.devices = (devices ?? []).sort((a, b) =>
        (a.ZDeviceName || a._NwkId).localeCompare(b.ZDeviceName || b._NwkId)
      );
    });
  }

  get enabled(): string[] {
    return this.categories.flatMap(category =>
      category.settings.filter(setting => this.values[setting.Name]).map(s => s.Name)
    );
  }

  get changes(): string[] {
    return this.settings
      .map(setting => setting.Name)
      .filter(name => String(this.values[name]) !== String(this.initial[name]));
  }

  get limits(): Setting[] {
    return LIMITS.map(name => this.settings.find(setting => setting.Name === name)).filter(setting => !!setting);
  }

  shown(category: Category): Setting[] {
    const text = this.search.trim().toLowerCase();
    return text
      ? category.settings.filter(
          setting => setting.Name.toLowerCase().includes(text) || this.label(setting).toLowerCase().includes(text)
        )
      : category.settings;
  }

  onIn(category: Category): number {
    return category.settings.filter(setting => this.values[setting.Name]).length;
  }

  label(setting: Setting): string {
    return this.translate.instant(setting.Name);
  }

  applyPreset(modules: string[]) {
    modules.filter(name => name in this.values).forEach(name => (this.values[name] = true));
  }

  presetModules(modules: string[]): string {
    return modules.filter(name => name in this.values).join(', ');
  }

  allOff() {
    this.categories.forEach(category => category.settings.forEach(setting => (this.values[setting.Name] = false)));
  }

  setMatching(nwkIds: string[]) {
    this.matching = nwkIds ?? [];
    this.values.MatchingNwkId = this.matching.length ? this.matching.join(',') : ALL_DEVICES;
  }

  restartNeeded(setting: Setting): boolean {
    return !!setting.restart_need;
  }

  discard() {
    this.values = { ...this.initial };
    this.matching = this.parseMatching(this.values.MatchingNwkId);
  }

  save() {
    const body: Record<string, { current: any }> = {};
    this.changes.forEach(name => {
      const value = this.values[name];
      body[name] = { current: typeof value === 'boolean' ? (value ? 1 : 0) : value };
    });
    this.saving = true;
    this.apiService.putSettingsDebug(body as any).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
        this.load();
        this.apiService.getRestartNeeded().subscribe(restart => {
          if (restart?.RestartNeeded > 0) {
            this.headerService.setRestart(true);
            this.toastr.warning(this.translate.instant('tools.debug.restart'));
          }
        });
      },
      error: () => (this.saving = false)
    });
  }

  private load() {
    this.apiService.getSettingsDebug().subscribe((themes: Settings[]) => {
      this.settings = (themes ?? []).flatMap(theme => theme.ListOfSettings ?? []);
      this.initial = {};
      this.settings.forEach(setting => {
        const value = setting.current_value !== '' ? setting.current_value : setting.default_value;
        this.initial[setting.Name] =
          setting.DataType === 'bool' ? value === true || value === 1 || value === '1' : value;
      });
      this.values = { ...this.initial };
      this.matching = this.parseMatching(this.values.MatchingNwkId);

      const switches = this.settings.filter(setting => setting.DataType === 'bool');
      const placed = new Set<string>();
      this.categories = CATEGORIES.map(category => {
        const settings = category.modules
          .map(name => switches.find(setting => setting.Name === name))
          .filter(setting => !!setting);
        settings.forEach(setting => placed.add(setting.Name));
        return { key: category.key, settings };
      });
      const rest = switches.filter(setting => !placed.has(setting.Name)).sort((a, b) => a.Name.localeCompare(b.Name));
      // The Python loggers of zigpy and its radio libraries, named "Python/<logger>"
      this.categories.push({ key: 'libraries', settings: rest.filter(setting => setting.Name.startsWith('Python/')) });
      this.categories.push({ key: 'other', settings: rest.filter(setting => !setting.Name.startsWith('Python/')) });
      this.categories = this.categories.filter(category => category.settings.length);
    });
  }

  private parseMatching(value: any): string[] {
    return String(value ?? ALL_DEVICES)
      .toLowerCase()
      .split(',')
      .map(item => item.trim())
      .filter(item => item && item !== ALL_DEVICES);
  }
}
