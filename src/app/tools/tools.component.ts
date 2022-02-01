import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { FileSaverService } from 'ngx-filesaver';
import { finalize } from 'rxjs/operators';

const log = new Logger('ToolsComponent');

function transformToTimestamp(key: any, value: any) {
  const datepipe = new DatePipe('en-US');
  const keyToTransform = ['TimeStamps', 'TimeStamp', 'Stamp', 'Time', 'StartTime', 'Starttime', 'BatteryUpdateTime'];
  if (key === 'LastSeen') {
    return datepipe.transform(value * 1000, 'dd/MM/yyyy HH:mm:ss');
  } else if (keyToTransform.indexOf(key) > -1) {
    if (value > 0) {
      let calc = value * 1000;
      calc = Number(calc.toFixed(0));
      return datepipe.transform(calc, 'dd/MM/yyyy HH:mm:ss');
    } else {
      return value;
    }
  } else {
    return value;
  }
}

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss']
})
export class ToolsComponent implements OnInit {
  json: Object | undefined = null;
  isLoading = false;
  isInfosPluginLoading = false;
  isInfosCoordinator = false;

  constructor(private apiService: ApiService, private fileSaverService: FileSaverService) {}

  ngOnInit() {}

  onClick(device: string) {
    this.isInfosPluginLoading = false;
    this.isInfosCoordinator = false;
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
      this.isInfosPluginLoading = true;
    }
    if (device === 'coordinator') {
      this.isInfosCoordinator = true;
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

  callbackservice(json: any) {
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
