import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';


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
    this.apiService.putPairingFullReset(this.form.get('deviceSelected').value._NwkId).subscribe(() => {
      this.toastr.success(this.translate.instant('admin.fullreset.notify'));
    });
  }
}
