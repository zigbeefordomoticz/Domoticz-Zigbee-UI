import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { LogFile } from '@app/shared/models/log';
import { TranslateService } from '@ngx-translate/core';
import { FileSaverService } from 'ngx-filesaver';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { transformToTimestamp } from '../shared/utils/transform-timestamp';
import { redact } from './support-bundle';

interface Source {
  key: string;
  route: string;
  load: () => Observable<any>;
}

interface SourceGroup {
  key: string;
  sources: Source[];
}

/**
 * Tools → Data: every read-only view of the plugin, grouped, opened in a side viewer, and a support
 * bundle that puts several of them in one file.
 *
 * What leaves the page (download, copy, bundle) goes through redact(): /plugin carries the
 * Domoticz API URL and credentials, /domoticz-env the Domoticz login, /coordinator the network key.
 * The viewer shows the answer as the plugin sent it.
 */
@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
  standalone: false
})
export class ToolsComponent implements OnInit {
  @ViewChild('viewer') viewerRef: ElementRef<HTMLElement>;

  logFile: LogFile = null;
  groups: SourceGroup[] = [];
  bundle: Source[] = [];
  bundleSelected = new Set<string>(['infos', 'plugin-health', 'plugin-stat', 'coordinator', 'settings', 'errors']);
  bundling = false;

  viewed: Source = null;
  json: any = null;
  readAt: Date = null;
  loading = false;

  private sources: Record<string, Source>;

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private fileSaverService: FileSaverService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const api = this.apiService;
    const source = (key: string, route: string, load: () => Observable<any>): Source => ({ key, route, load });
    const list = [
      source('infos', '/plugin', () => api.getPlugin()),
      source('plugin-health', '/plugin-health', () => api.getPluginhealth()),
      source('plugin-stat', '/plugin-stat', () => api.getPluginStats()),
      source('settings', '/setting', () => api.getSettings()),
      source('domoticz-env', '/domoticz-env', () => api.getDomoticzEnv()),
      source('zdevice-raw', '/zdevice-raw', () => api.getRawZDevices()),
      source('zdevice-name', '/zdevice-name', () => api.getZDeviceName()),
      source('ieee2nwk-raw', '/ieee2nwk-raw', () => api.getIeee2nwkRaw()),
      source('battery-state', '/battery-state', () => api.getBatteryState()),
      source('non-optimized', '/non-optmize-device-configuration', () => this.nonOptimized()),
      source('zgroups', '/zgroup', () => api.getZGroups()),
      source('zgroup-list-available-device', '/zgroup-list-available-device', () => api.getZGroupDevicesAvalaible()),
      source('coordinator', '/coordinator', () => api.getCoordinator()),
      source('ota-firmware-available', '/ota-firmware-available', () => api.getOtaFirmwareAvailable()),
      source('zlinky', '/zlinky', () => api.getZlinky()),
      source('gamma-troniques-ticmeter', '/gamma-troniques-ticmeter', () => api.getGammaTroniqueTicmeter()),
      source('chameleon-ticmeter', '/chameleon-ticmeter', () => api.getChameleonTicmeter()),
      source('help', '/help', () => api.getHelp()),
      // Bundle only: reading it marks the errors as read, as the Errors tab does
      source('errors', '/log-error-history', () => api.getLogErrorHistory())
    ];
    this.sources = Object.fromEntries(list.map(item => [item.key, item]));
    const pick = (...keys: string[]) => keys.map(key => this.sources[key]);
    this.groups = [
      { key: 'plugin', sources: pick('infos', 'plugin-health', 'plugin-stat', 'settings', 'domoticz-env') },
      {
        key: 'devices',
        sources: pick('zdevice-raw', 'zdevice-name', 'ieee2nwk-raw', 'battery-state', 'non-optimized')
      },
      { key: 'groups', sources: pick('zgroups', 'zgroup-list-available-device') },
      { key: 'coordinator', sources: pick('coordinator', 'ota-firmware-available') },
      { key: 'manufacturer', sources: pick('zlinky', 'gamma-troniques-ticmeter', 'chameleon-ticmeter') },
      { key: 'reference', sources: pick('help') }
    ];
    this.bundle = pick(
      'infos',
      'plugin-health',
      'plugin-stat',
      'coordinator',
      'settings',
      'errors',
      'zdevice-raw',
      'zdevice-name',
      'zgroups',
      'battery-state'
    );
    this.apiService.getLog().subscribe(logFile => (this.logFile = logFile?.URL ? logFile : null));
  }

  view(source: Source) {
    this.viewed = source;
    this.json = null;
    this.loading = true;
    // On a phone the viewer comes after the whole list: bring it into sight
    setTimeout(() => {
      const viewer = this.viewerRef?.nativeElement;
      if (viewer && viewer.getBoundingClientRect().top > window.innerHeight) {
        viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    source
      .load()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(json => {
        this.json = JSON.parse(JSON.stringify(json ?? null), transformToTimestamp);
        this.readAt = new Date();
      });
  }

  refresh() {
    if (this.viewed) {
      this.view(this.viewed);
    }
  }

  close() {
    this.viewed = null;
    this.json = null;
  }

  download(source: Source) {
    source.load().subscribe(json => this.save(`z4d-${source.key}.json`, redact(json)));
  }

  copy() {
    navigator.clipboard
      ?.writeText(JSON.stringify(redact(this.json), null, 2))
      .then(() => this.toastr.success(this.translate.instant('tools.data.copied')));
  }

  toggleBundle(key: string) {
    if (this.bundleSelected.has(key)) {
      this.bundleSelected.delete(key);
    } else {
      this.bundleSelected.add(key);
    }
  }

  downloadBundle() {
    const chosen = this.bundle.filter(source => this.bundleSelected.has(source.key));
    if (!chosen.length) {
      return;
    }
    this.bundling = true;
    forkJoin(chosen.map(source => source.load().pipe(catchError(() => of({ error: 'not available' })))))
      .pipe(finalize(() => (this.bundling = false)))
      .subscribe(answers => {
        const doc: Record<string, any> = { exported: new Date().toISOString(), sources: {} };
        chosen.forEach((source, i) => (doc.sources[source.route] = redact(answers[i])));
        if (this.bundleSelected.has('errors')) {
          this.headerService.setError(false);
        }
        this.save(`z4d-support-${this.stamp()}.json`, doc);
      });
  }

  downloadLog() {
    const logFile = this.logFile;
    this.apiService.downloadLog(logFile.URL).subscribe(file => this.fileSaverService.save(file.body, logFile.Filename));
  }

  // What the former "Non-optimized devices" button gathered: the configuration of every device not certified
  private nonOptimized(): Observable<any[]> {
    return this.apiService.getZDeviceName().pipe(
      map(devices => (devices ?? []).filter(device => !device.CertifiedDevice)),
      switchMap(devices =>
        devices.length ? forkJoin(devices.map(device => this.apiService.getNonOptimizedDevice(device._NwkId))) : of([])
      )
    );
  }

  private save(fileName: string, doc: any) {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: this.fileSaverService.genType(fileName) });
    this.fileSaverService.save(blob, fileName);
  }

  private stamp(): string {
    const d = new Date();
    const two = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}`;
  }
}
