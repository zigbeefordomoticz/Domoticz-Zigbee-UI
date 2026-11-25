import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { DeviceByName, toGreenPowerRow } from '@app/shared/models/device-by-name';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss'],
  standalone: false
})
export class DeviceComponent implements OnInit {
  form: FormGroup;
  devices: DeviceByName[];
  greenPower: DeviceByName[] = [];

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      devices: this.formBuilder.group({}),
      permit: this.formBuilder.group({})
    });

    this.apiService.getZDeviceName().subscribe(result => {
      this.devices = result;
    });
    // A plugin without Green Power has no such route: the list goes on without them
    this.apiService
      .getRawZgpDevices()
      .pipe(catchError(() => of([])))
      .subscribe(result => (this.greenPower = (Array.isArray(result) ? result : []).map(toGreenPowerRow)));
  }
}
