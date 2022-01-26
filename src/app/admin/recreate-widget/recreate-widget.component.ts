import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { UnsubscribeOnDestroyAdapter } from '../../shared/adapter/unsubscribe-adapter';

const log = new Logger('RecreateWidgetComponent');

@Component({
  selector: 'app-recreate-widget',
  templateUrl: './recreate-widget.component.html',
  styleUrls: ['./recreate-widget.component.scss']
})
export class RecreateWidgetComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
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

  recreate() {
    this.apiService.putRecreateWidgets(this.form.get('deviceSelected').value._NwkId).subscribe((result: any) => {
      this.toastr.success(this.translate.instant('admin.recreate.notify'));
    });
  }
}