import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { Capabilities, Capability } from '@app/shared/models/capabilities';
import { ZDevices } from '@app/shared/models/device';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-debug-command',
  templateUrl: './debug-command.component.html',
  styleUrls: ['./debug-command.component.scss']
})
export class DebugCommandComponent implements OnInit {
  routers: ZDevices[];
  capabilities: Capabilities;
  form: FormGroup;
  colorPicker = 'rgba(30,96,239,0.54)';
  capaSelected: Capability;

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      level: [null, [Validators.nullValidator, Validators.min(0), Validators.max(100)]],
      type: [null, Validators.required],
      action: [null, Validators.required],
      deviceSelected: [null, Validators.required],
      effect: [null, Validators.compose([Validators.nullValidator, Validators.pattern('^[0-9A-Fa-f]+')])]
    });

    this.form.get('type').disable();

    this.apiService.getZDevices().subscribe(devices => {
      this.routers = devices.filter((router: any) => router.LogicalType === 'Router');
    });
  }

  callCapabilities(event: DeviceByName) {
    this.capaSelected = null;
    this.form.get('action').patchValue(null);
    this.form.get('type').patchValue(null);
    this.capabilities = null;
    this.apiService.getDevCap(event._NwkId).subscribe(capabilities => {
      this.capabilities = capabilities;
    });
  }

  setAction(capa: Capability) {
    this.capaSelected = capa;
    this.form.get('type').patchValue(null);
    if (capa && capa.Type === true) {
      this.form.get('type').enable();
    } else {
      this.form.get('type').disable();
    }
  }

  callAction() {
    let colorTosend = null;
    let valueToSend = null;
    if (this.testRGB) {
      if (this.colorPicker.startsWith('rgba')) {
        let value = this.colorPicker.replace('rgba(', '');
        value = value.replace(')', '');
        const valueTab = value.split(',');
        if (valueTab.length === 4) {
          valueToSend = Number(valueTab[3]) * 100;
          colorTosend = 'rgb(' + valueTab[0] + ',' + valueTab[1] + ',' + valueTab[2] + ')';
        }
      } else {
        if (this.colorPicker.startsWith('rgb')) {
          valueToSend = 100;
          colorTosend = this.colorPicker;
        }
      }
    }

    if (!valueToSend && this.capaSelected.Value) {
      if (this.capaSelected.Value === 'hex') {
        valueToSend = this.form.get('effect').value;
      }
      if (this.capaSelected.Value === 'int') {
        valueToSend = this.form.get('level').value;
      }
    }

    const command = {
      NwkId: this.form.get('deviceSelected').value._NwkId,
      Command: this.form.get('action').value.actuator,
      Value: valueToSend,
      Color: colorTosend,
      Type: this.form.get('type').value
    };
    this.apiService.putDevCommand(command).subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.commandsent.notify'));
    });
  }

  get testRGB(): boolean {
    if (this.form.get('type').value) {
      return (this.form.get('type').value as string).startsWith('ColorControl');
    }
    return false;
  }
}
