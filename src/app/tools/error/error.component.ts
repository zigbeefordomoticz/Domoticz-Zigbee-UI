import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { FileSaverService } from 'ngx-filesaver';
import { finalize } from 'rxjs/operators';

const log = new Logger('ErrorComponent');

function transformToTimestamp(key: any, value: any) {
  const datepipe = new DatePipe('en-US');
  const keyToTransform = ['TimeStamps', 'TimeStamp', 'Stamp', 'Time', 'StartTime'];
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
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {
  json: Object | undefined = null;
  isLoading = false;
  isInfosPluginLoading = false;
  isInfosCoordinator = false;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private datePipe: DatePipe,
    private headerService: HeaderService,
    private fileSaverService: FileSaverService
  ) {}

  ngOnInit() {}

  onClick(device: string) {
    this.isInfosPluginLoading = false;
    this.isInfosCoordinator = false;
    this.json = null;
    let service;

    if (device === 'log-error-history') {
      service = this.apiService.getLogErrorHistory();
      this.headerService.setError(false);
    }
    if (device === 'clear-error-history') {
      service = this.apiService.clearLogErrorHistory();
      this.headerService.setError(false);
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
    const fileName = 'errors.json';
    const fileType = this.fileSaverService.genType(fileName);
    const txtBlob = new Blob([JSON.stringify(json)], { type: fileType });
    this.fileSaverService.save(txtBlob, fileName);
  }
}
