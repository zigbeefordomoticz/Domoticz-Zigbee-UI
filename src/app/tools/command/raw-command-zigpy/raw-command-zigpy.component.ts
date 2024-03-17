import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-raw-command-zigpy',
  templateUrl: './raw-command-zigpy.component.html',
  styleUrls: ['./raw-command-zigpy.component.scss']
})
export class RawCommandZigpyComponent implements OnInit {
  devices$: Observable<DeviceByName[]>;
  form: FormGroup;

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {}

  selectedCar: string;

  TrueFalse = [
    { id: false, name: 'False' },
    { id: true, name: 'True' }
  ];

  ngOnInit() {
    this.form = this.formBuilder.group({
      ProfileId: ['0104', Validators.required],
      ClusterId: ['0000', Validators.required],
      TargetAddr: [null, Validators.required],
      TargetEp: ['01', Validators.required],
      SourceEp: ['01', Validators.required],
      Sqn: ['55', Validators.required],
      Payload: [null, Validators.required],
      GroupAddressFlag: [false, Validators.required],
      AckMode: [false, Validators.required]
    });
    this.devices$ = this.apiService.getZDeviceName();
  }

  putCommand() {
    this.apiService.putCommandRawZigpy(this.form.value).subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.commandsent.notify'));
    });
  }
}
