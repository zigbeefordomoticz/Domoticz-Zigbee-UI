import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Capabilities } from '@app/shared/models/capabilities';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger(' DeviceComponent');

@Component({
  selector: 'app-command-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss']
})
export class DeviceComponent implements OnInit {
  @Input() device: any;
  form: FormGroup;
  capabilities: Capabilities;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private translate: TranslateService) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      level: ['', [Validators.min(0), Validators.max(100)]]
    });

    this.apiService.getDevCap(this.device._NwkId).subscribe(capabilities => {
      this.capabilities = capabilities;
    });
  }

  onClick(action: string) {
    const command = { NwkId: this.device._NwkId, Command: action };
    this.apiService.putDevCommand(command).subscribe();
  }
}
