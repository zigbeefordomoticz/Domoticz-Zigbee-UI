import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { UnsubscribeOnDestroyAdapter } from '../../shared/adapter/unsubscribe-adapter';

const log = new Logger('PermitToJoinRouterComponent');

@Component({
  selector: 'app-permit-to-join-router',
  templateUrl: './permit-to-join-router.component.html',
  styleUrls: ['./permit-to-join-router.component.scss'],
})
export class PermitToJoinRouterComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  permitToJoin: any;
  routers: DeviceByName[];
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
      deviceSelected: [null, Validators.required],
    });

    this.subs.sink = forkJoin([this.apiService.getPermitToJoin(), this.apiService.getZDevices()]).subscribe(
      ([permitToJoin, devices]) => {
        this.permitToJoin = permitToJoin;
        this.routers = devices.filter((router: any) => router.LogicalType === 'Router');
      }
    );
  }

  updatePermitToJoin(value: number) {
    this.permitToJoin.PermitToJoin = value;
    this.permitToJoin.Router = (this.form.get('deviceSelected').value as DeviceByName)._NwkId;

    this.apiService.putPermitToJoin(this.permitToJoin).subscribe((result: any) => {
      this.toastr.success(this.translate.instant('api.global.succes.update.title'));
    });
  }
}
