import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { Capabilities } from '@app/shared/models/capabilities';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

const log = new Logger('CommandComponent');

@Component({
  selector: 'app-debug-command',
  templateUrl: './debug-command.component.html',
  styleUrls: ['./debug-command.component.scss']
})
export class DebugCommandComponent implements OnInit {
  routers: DeviceByName[];
  capabilities: Capabilities;
  form: FormGroup;
  colorPicker = 'rgba(30,96,239,0.54)';

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private translate: TranslateService) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      level: [null, [Validators.nullValidator, Validators.min(0), Validators.max(100)]],
      type: [null, Validators.required],
      action: [null, Validators.required],
      deviceSelected: [null, Validators.required]
    });

    this.apiService.getZDevices().subscribe(devices => {
      this.routers = devices.filter((router: any) => router.LogicalType === 'Router');
    });
  }

  callCapabilities(event: DeviceByName) {
    this.form.get('action').patchValue(null);
    this.form.get('type').patchValue(null);
    this.capabilities = null;
    this.apiService.getDevCap(event._NwkId).subscribe(capabilities => {
      this.capabilities = capabilities;
    });
  }

  setAction(action: string) {
    this.form.get('type').patchValue(null);
  }

  callAction() {
    let colorTosend = null;
    if (this.colorPicker.startsWith('rgba') && this.testRGB) {
      let value = this.colorPicker.replace('rgba(', '');
      value = value.replace(')', '');
      const valueTab = value.split(',');
      if (valueTab.length === 4) {
        this.form.get('level').patchValue(Number(valueTab[3]) * 100);
        colorTosend = 'rgb(' + valueTab[0] + ',' + valueTab[1] + ',' + valueTab[2] + ')';
      }
    }

    const command = {
      NwkId: this.form.get('deviceSelected').value._NwkId,
      Command: this.form.get('action').value,
      Value: this.form.get('level').value,
      Color: colorTosend,
      Type: this.form.get('type').value
    };
    this.apiService.putDevCommand(command).subscribe();
  }

  get testRGB(): boolean {
    if (this.form.get('type').value) {
      return (this.form.get('type').value as string).startsWith('ColorControl');
    }
    return false;
  }
}
