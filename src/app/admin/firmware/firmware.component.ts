import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DevicesByManufacturer, Firmware, FirmwareUpdate } from '@app/shared/models/firmware';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
  selector: 'app-firmware',
  templateUrl: './firmware.component.html',
  styleUrls: ['./firmware.component.scss']
})
export class FirmwareComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  form: FormGroup;
  manufacturerList$: Observable<string[]>;
  devicesList$: Observable<DevicesByManufacturer[]>;
  firmwares: Firmware[];
  tempFirmwares: any;
  devicesModal: DevicesByManufacturer[];
  firmwareModal: Firmware;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {
    super();
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      manufacturer: [null, Validators.required],
      firmware: [null, Validators.required],
      device: [null, Validators.required],
      force: [false]
    });

    this.manufacturerList$ = this.apiService.getOtaFirmware().pipe(
      map(firmwares => {
        this.tempFirmwares = firmwares[0];
        return Object.keys(this.tempFirmwares);
      })
    );

    this.subs.sink = this.form
      .get('manufacturer')
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((manufacturer: string) => {
        this.form.get('firmware').reset();
        this.form.get('device').reset();
        if (manufacturer) {
          this.firmwares = this.tempFirmwares[manufacturer];
          this.firmwares.forEach(firm => {
            firm.label = this.getLabelFirmware(firm);
          });
        } else {
          this.firmwares = null;
        }
      });

    this.subs.sink = this.form
      .get('firmware')
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((firmware: Firmware) => {
        this.form.get('device').reset();
        if (firmware) {
          this.devicesList$ = this.apiService.getDeviceByOtaFirmware(firmware.ManufCode).pipe(
            map(devices => {
              devices.forEach(device => {
                device.label = this.getLabelDevice(device);
              });
              return devices;
            })
          );
        } else {
          this.devicesList$ = null;
        }
      });
  }

  updateFirmware() {
    const devicesToUpdate: FirmwareUpdate[] = [];
    const manufacturer = this.form.get('manufacturer').value;
    const fileName = (this.form.get('firmware').value as Firmware).FileName;
    const devices = this.form.get('device').value as DevicesByManufacturer[];
    devices.forEach(device => {
      const deviceToUpdate = new FirmwareUpdate();
      deviceToUpdate.Brand = manufacturer;
      deviceToUpdate.Ep = device.Ep;
      deviceToUpdate.FileName = fileName;
      deviceToUpdate.NwkId = device.Nwkid;
      deviceToUpdate.ForceUpdate = this.form.get('force').value;
      devicesToUpdate.push(deviceToUpdate);
    });

    this.apiService.putOtaFirmware(devicesToUpdate).subscribe(() => {
      this.devicesList$ = null;
      this.firmwares = null;
      this.toastr.success(this.translate.instant('admin.firmware.notify'));
      this.form.reset();
    });
  }

  open(content: any) {
    this.firmwareModal = this.form.get('firmware').value as Firmware;
    this.devicesModal = this.form.get('device').value as DevicesByManufacturer[];
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => {
        this.updateFirmware();
      }
    );
  }

  private getLabelFirmware(firmware: Firmware): string {
    return 'FileName : '
      .concat(firmware.FileName)
      .concat(' - ImageType : ')
      .concat(firmware.ImageType)
      .concat(' - ApplicationBuild : ')
      .concat(firmware.ApplicationBuild)
      .concat(' - ApplicationRelease : ')
      .concat(firmware.ApplicationRelease)
      .concat(' - StackBuild : ')
      .concat(firmware.StackBuild)
      .concat(' - StackRelease : ')
      .concat(firmware.StackRelease);
  }

  private getLabelDevice(device: DevicesByManufacturer): string {
    return 'DeviceName : '
      .concat(device.DeviceName)
      .concat(' - Ep : ')
      .concat(device.Ep)
      .concat(' - Nwkid : ')
      .concat(device.Nwkid)
      .concat(' - OTALastTime : ')
      .concat(device.OTALastTime)
      .concat(' - OTAType : ')
      .concat(device.OTAType)
      .concat(' - OTAVersion : ')
      .concat(device.OTAVersion)
      .concat(' - SWBUILD_1 : ')
      .concat(device.SWBUILD_1)
      .concat(' - SWBUILD_3 : ')
      .concat(device.SWBUILD_3);
  }
}
