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
  deviceSelected: DeviceByName;
  action: string;
  type: string;
  form: FormGroup;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private translate: TranslateService) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      level: ['', [Validators.min(0), Validators.max(100)]]
    });

    this.apiService.getZDevices().subscribe(devices => {
      this.routers = devices.filter((router: any) => router.LogicalType === 'Router');
    });
  }

  callCapabilities(event: DeviceByName) {
    this.capabilities = null;
    this.action = null;
    this.type = null;
    this.deviceSelected = event;
    this.apiService.getDevCap(event._NwkId).subscribe(capabilities => {
      this.capabilities = capabilities;
    });
  }

  setAction(action: string) {
    this.action = action;
    this.type = null;
  }

  setType(type: string) {
    this.type = type;
  }

  callAction() {
    const command = { NwkId: this.deviceSelected._NwkId, Command: this.action, Value: '', Color: '' };
    this.apiService.putDevCommand(command).subscribe();
  }
}
