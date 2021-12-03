import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { UnsubscribeOnDestroyAdapter } from '../../shared/adapter/unsubscribe-adapter';

const log = new Logger('PairingFullResetComponent');

@Component({
  selector: 'app-pairing-full-reset',
  templateUrl: './pairing-full-reset.component.html',
  styleUrls: ['./pairing-full-reset.component.scss']
})
export class PairingFullResetComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  devices$: Observable<DeviceByName[]>;
  form: FormGroup;

  constructor(
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      deviceSelected: [null, Validators.required]
    });

    this.devices$ = this.apiService.getZDeviceName();
  }

  fullReset() {
    this.apiService.putPairingFullReset(this.form.get('deviceSelected').value._NwkId).subscribe((result: any) => {
      this.toastr.success(this.translate.instant('admin.fullreset.notify'));
    });
  }
}
