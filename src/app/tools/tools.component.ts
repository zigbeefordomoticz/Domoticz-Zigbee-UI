import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { LogFile } from '@app/shared/models/log';
import { FileSaverService } from 'ngx-filesaver';
import { finalize, forkJoin, Observable } from 'rxjs';
import { transformToTimestamp } from '../shared/utils/transform-timestamp';

const log = new Logger('ToolsComponent');

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  json: Object | undefined = null;
  isLoading = false;
  logFile$: Observable<LogFile>;

  constructor(private apiService: ApiService, private fileSaverService: FileSaverService) {}

  ngOnInit() {
    this.logFile$ = this.apiService.getLog();
  }

  onClick(device: string) {
    this.json = null;
    let service;
    if (device === 'devices') {
      service = this.apiService.getDevices();
    }
    if (device === 'zdevices') {
      service = this.apiService.getZDevices();
    }
    if (device === 'zgroups') {
      service = this.apiService.getZGroups();
    }
    if (device === 'zdevice-raw') {
      service = this.apiService.getRawZDevices();
    }
    if (device === 'infos') {
      service = this.apiService.getPlugin();
    }
    if (device === 'coordinator') {
      service = this.apiService.getCoordinator();
    }
    if (device === 'plugin-health') {
      service = this.apiService.getPluginhealth();
    }
    if (device === 'zgroup-list-available-device') {
      service = this.apiService.getZGroupDevicesAvalaible();
    }
    if (device === 'settings') {
      service = this.apiService.getSettings();
    }
    if (device === 'plugin-stat') {
      service = this.apiService.getPluginStats();
    }
    if (device === 'zdevice-name') {
      service = this.apiService.getZDeviceName();
    }
    if (device === 'domoticz-env') {
      service = this.apiService.getDomoticzEnv();
    }
    if (device === 'battery-state') {
      service = this.apiService.getBatteryState();
    }

    if (service) {
      service
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((json: Object) => {
          this.callbackservice(json);
        });
    }
  }

  getAllNonOptimizedDevice(): void {
    this.json = null;
    this.apiService.getZDeviceName().subscribe(result => {
      const nonOptimized = result
        .filter(device => !device.CertifiedDevice)
        .map(device => this.getNonOptimizedDevice(device._NwkId));
      forkJoin(nonOptimized).subscribe(results => this.callbackservice(results));
    });
  }

  private getNonOptimizedDevice(nwkId: string): Observable<any> {
    return this.apiService.getNonOptimizedDevice(nwkId);
  }

  download(logFile: LogFile) {
    const fileName = logFile.Filename;
    const fileType = this.fileSaverService.genType(fileName);
    this.apiService.downloadLog(logFile.URL).subscribe(file => {
      this.fileSaverService.save(file.body, fileName);
    });
  }

  private callbackservice(json: any) {
    const jsonStr = JSON.stringify(json);
    this.json = JSON.parse(jsonStr, transformToTimestamp);
  }

  export(json: any) {
    const fileName = 'export.json';
    const fileType = this.fileSaverService.genType(fileName);
    const txtBlob = new Blob([JSON.stringify(json)], { type: fileType });
    this.fileSaverService.save(txtBlob, fileName);
  }
}
