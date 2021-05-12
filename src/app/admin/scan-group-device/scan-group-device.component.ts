import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { DeviceAvailable, DevicesAvailable } from '@app/shared/models/group';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('ReloadPluginComponent');

@Component({
  selector: 'app-scan-group-device',
  templateUrl: './scan-group-device.component.html',
  styleUrls: ['./scan-group-device.component.scss']
})
export class ScanGroupDeviceComponent implements OnInit {
  devices: DeviceAvailable[];
  form: FormGroup;

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      deviceSelected: [null, Validators.required]
    });

    this.apiService.getZGroupDevicesAvalaible().subscribe((devices: Array<DevicesAvailable>) => {
      const devicesToAdd: Array<DeviceAvailable> = [];
      if (devices && devices.length > 0) {
        devices.forEach((device) => {
          device.WidgetList.forEach((widget) => {
            if (device._NwkId !== '0000') {
              const deviceToAdd: DeviceAvailable = new DeviceAvailable();
              deviceToAdd.Ep = widget.Ep;
              deviceToAdd.IEEE = widget.IEEE;
              deviceToAdd.Name = widget.Name;
              deviceToAdd.ZDeviceName = widget.ZDeviceName;
              deviceToAdd._ID = widget._ID;
              deviceToAdd._NwkId = device._NwkId;
              devicesToAdd.push(deviceToAdd);
            }
          });
        });
        this.devices = [...devicesToAdd];
      }
    });
  }

  scan() {
    const nwkids: string[] = [];
    const selected = this.form.get('deviceSelected').value as DeviceAvailable[];
    selected.forEach((device) => nwkids.push(device._NwkId));

    this.apiService.putScanDeviceForGrp(nwkids).subscribe(() => {
      this.toastr.success(this.translate.instant('admin.scan.group.device.notify'));
    });
  }
}
