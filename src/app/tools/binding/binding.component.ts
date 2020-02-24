import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { DeviceBind } from '@app/shared/models/device-bind';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('BindingComponent');

@Component({
  selector: 'app-binding',
  templateUrl: './binding.component.html',
  styleUrls: ['./binding.component.scss']
})
export class BindingComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  form: FormGroup;
  clusters$: Observable<string[]>;
  devicesSource: DeviceBind[];
  devicesTarget: DeviceBind[];
  devicesTargetFiltered: DeviceBind[];

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
      source: [null, Validators.required],
      target: [null, Validators.required],
      cluster: [null, Validators.required]
    });

    this.clusters$ = this.apiService.getBindLSTcluster();

    this.subs.sink = this.form.get('cluster').valueChanges.subscribe(change => {
      this.apiService.getBindLSTdevice(this.form.get('cluster').value).subscribe(devices => {
        this.devicesSource = devices;
        this.devicesTarget = devices;
      });
    });
  }

  filterDevices(device: DeviceBind) {
    this.form.get('target').patchValue(null);
    this.devicesTargetFiltered = this.devicesTarget.filter(deviceBind => device.NwkId !== deviceBind.NwkId);
  }

  putBinding() {
    const values = {
      sourceIeee: this.form.get('source').value.IEEE,
      sourceEp: this.form.get('source').value.Ep,
      destIeee: this.form.get('target').value.IEEE,
      destEp: this.form.get('target').value.Ep,
      cluster: this.form.get('cluster').value
    };
    this.apiService.putBinding(values).subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.update.title'));
      this.form.reset();
    });
  }

  putUnBinding() {
    const values = {
      sourceIeee: this.form.get('source').value.IEEE,
      sourceEp: this.form.get('source').value.Ep,
      destIeee: this.form.get('target').value.IEEE,
      destEp: this.form.get('target').value.Ep,
      cluster: this.form.get('cluster').value
    };
    this.apiService.putUnBinding(values).subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.update.title'));
      this.form.reset();
    });
  }
}
