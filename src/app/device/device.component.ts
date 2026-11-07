import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * A Green Power device of /zgp-device-raw as a row of the device table. Its NWK is the low
 * half of its source ID and may equal a Zigbee device's, so the row is keyed by the source ID.
 */
function toGreenPowerRow(record: any): DeviceByName {
  const srcId =
    typeof record?.src_id === 'number'
      ? '0x' + record.src_id.toString(16).toUpperCase().padStart(8, '0')
      : String(record?.IEEE ?? '');
  return {
    IEEE: record?.IEEE ?? '',
    MacCapa: [],
    Model: record?.Model || '',
    Health: '',
    Status: 'inDB',
    WidgetList: Array.isArray(record?.WidgetList) ? record.WidgetList : [],
    ZDeviceName: '',
    _NwkId: srcId,
    LQI: typeof record?.LQI === 'number' ? record.LQI : undefined,
    LastSeen: typeof record?.LastSeen === 'number' ? record.LastSeen : undefined,
    CertifiedDevice: true,
    GreenPower: true
  };
}

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
