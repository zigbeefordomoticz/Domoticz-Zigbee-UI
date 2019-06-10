import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { finalize } from 'rxjs/operators';
import { Logger } from '@app/core';
import { DatePipe } from '@angular/common';

const log = new Logger('ToolsComponent');

function transformToTimestamp(key: any, value: any) {
  const datepipe = new DatePipe('en-US');
  if (key === 'LastSeen') {
    return datepipe.transform(value * 1000, 'dd/MM/yyyy HH:mm:ss');
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

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private datePipe: DatePipe) {}

  ngOnInit() {}

  onClick(device: string) {
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

  callbackservice(json: any) {
    const jsonStr = JSON.stringify(json);
    this.json = JSON.parse(jsonStr, transformToTimestamp);
  }
}
