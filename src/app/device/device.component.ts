import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Logger } from '@app/core';
import { DeviceByName } from '@app/shared/models/device-by-name';

const log = new Logger('DeviceComponent');

@Component({
  selector: 'app-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss']
})
export class DeviceComponent implements OnInit {
  form: FormGroup;
  devices: any;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private translate: TranslateService) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      devices: this.formBuilder.group({}),
      permit: this.formBuilder.group({})
    });

    this.apiService.getZDeviceName().subscribe((result: any) => {
      this.devices = result;
    });
  }
}
