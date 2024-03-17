import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { FileSaverService } from 'ngx-filesaver';
import { finalize } from 'rxjs/operators';
import { transformToTimestamp } from '../../shared/utils/transform-timestamp';


@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent {
  json: object | undefined = null;
  isLoading = false;

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private fileSaverService: FileSaverService
  ) { }


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
        .subscribe((json: object) => {
          this.callbackservice(json);
        });
    }
  }

  callbackservice(json: object) {
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
