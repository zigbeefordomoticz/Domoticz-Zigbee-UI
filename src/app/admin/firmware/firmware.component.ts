import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { DevicesByManufacturer, Firmware, FirmwareUpdate } from '../../shared/models/firmware';

const log = new Logger('BindingComponent');

@Component({
  selector: 'app-firmware',
  templateUrl: './firmware.component.html',
  styleUrls: ['./firmware.component.scss']
})
export class FirmwareComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  form: FormGroup;
  manufacturerList$: Observable<string[]>;
  devicesList$: Observable<DevicesByManufacturer[]>;
  firmwares: any;
  tempFirmwares: any;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {
    super();
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      manufacturer: [null, Validators.required],
      firmware: [null, Validators.required],
      device: [null, Validators.required]
    });

    this.manufacturerList$ = this.apiService.getOtaFirmware().pipe(
      map(firmwares => {
        this.tempFirmwares = firmwares[0];
        return Object.keys(this.tempFirmwares);
      })
    );

    this.subs.sink = this.form
      .get('manufacturer')
      .valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((manufacturer: string) => {
        if (manufacturer) {
          this.form.get('firmware').reset();
          this.firmwares = this.tempFirmwares[manufacturer];
        } else {
          this.firmwares = null;
        }
      });

    this.subs.sink = this.form
      .get('firmware')
      .valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((firmware: Firmware) => {
        if (firmware) {
          this.devicesList$ = this.apiService.getDeviceByOtaFirmware(firmware.ManufCode);
        } else {
          this.devicesList$ = null;
        }
      });
  }

  updateFirmware() {
    const update = new FirmwareUpdate();
    update.Brand = this.form.get('manufacturer').value;
    update.Ep = (this.form.get('device').value as DevicesByManufacturer).Ep;
    update.FileName = (this.form.get('firmware').value as Firmware).FileName;
    update.NwkId = (this.form.get('device').value as DevicesByManufacturer).Nwkid;

    this.apiService.putOtaFirmware(update).subscribe(() => {
      this.devicesList$ = null;
      this.firmwares = null;
      this.toastr.success(this.translate.instant('api.global.succes.update.title'));
      this.form.reset('', {
        onlySelf: true,
        emitEvent: false
      });
    });
  }
}
