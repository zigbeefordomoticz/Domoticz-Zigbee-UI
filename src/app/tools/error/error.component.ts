import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { FileSaverService } from 'ngx-filesaver';
import { finalize } from 'rxjs/operators';
import { transformToTimestamp } from '../../shared/utils/transform-timestamp';

const log = new Logger('ErrorComponent');

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {
  json: Object | undefined = null;
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private fileSaverService: FileSaverService
  ) {}

  ngOnInit() {}

  onClick(device: string) {
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

  callbackservice(json: Object) {
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
