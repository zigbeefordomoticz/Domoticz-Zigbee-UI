import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { ZDevices } from '@app/shared/models/device';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { UnsubscribeOnDestroyAdapter } from '../../shared/adapter/unsubscribe-adapter';

const log = new Logger('PermitToJoinRouterComponent');

@Component({
  selector: 'app-permit-to-join-router',
  templateUrl: './permit-to-join-router.component.html',
  styleUrls: ['./permit-to-join-router.component.scss']
})
export class PermitToJoinRouterComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  permitToJoin: any;
  routers: ZDevices[];
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

    this.subs.sink = forkJoin([this.apiService.getPermitToJoin(), this.apiService.getZDevices()]).subscribe(
      ([permitToJoin, devices]) => {
        this.permitToJoin = permitToJoin;
        this.routers = devices.filter(
          (router: any) => router.LogicalType === 'Router' || router.LogicalType === 'Coordinator'
        );
      }
    );
  }

  updatePermitToJoin(value: number) {
    this.permitToJoin.PermitToJoin = value;
    this.permitToJoin.Router = (this.form.get('deviceSelected').value as DeviceByName)._NwkId;

    this.apiService.putPermitToJoin(this.permitToJoin).subscribe((result: any) => {
      switch (value) {
        case 240: {
          this.toastr.success(this.translate.instant('admin.permittojoin.4min.notify'));
          break;
        }
        case 0: {
          this.toastr.success(this.translate.instant('admin.permittojoin.stop.notify'));
          break;
        }
        default: {
          this.toastr.success(this.translate.instant('api.global.succes.commandsent.notify'));
          break;
        }
      }
    });
  }
}
