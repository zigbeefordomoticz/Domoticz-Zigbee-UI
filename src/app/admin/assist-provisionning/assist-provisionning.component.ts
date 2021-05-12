import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { timer } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { NewDevice, NewHardware } from '../../shared/models/new-hardware';

const log = new Logger('PermitToJoinComponent');

@Component({
  selector: 'app-assist-provisionning',
  templateUrl: './assist-provisionning.component.html',
  styleUrls: ['./assist-provisionning.component.scss']
})
export class AssistProvisionningComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  newDevices: NewDevice;
  devices: DeviceByName[];
  devicePaired: NewHardware[];

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService
  ) {
    super();
  }

  ngOnInit() {
    this.newDevices = null;
    this.devices = null;
    this.devicePaired = [];
  }

  open(content: any) {
    this.newDevices = null;
    this.devices = null;
    this.devicePaired = [];
    this.spinner.show();
    this.subs.sink = this.apiService
      .getNewHardware(true)
      .pipe(
        concatMap(() =>
          timer(0, 10000)
            .pipe(concatMap(() => this.apiService.getReceiveNewHardware()))
            .pipe(
              map((receive) => {
                this.newDevices = receive;
                if (this.newDevices.NewDevices && this.newDevices.NewDevices.length > 0) {
                  this.createwidgets();
                }
              })
            )
        )
      )
      .subscribe();

    this.modalService
      .open(content, { ariaLabelledBy: 'modal-basic-title', size: 'lg', backdrop: 'static', keyboard: false })
      .result.then(
        (result) => {
          this.spinner.hide();
          this.apiService.getNewHardware(false).subscribe();
          this.subs.unsubscribe();
        },
        (reason) => {}
      );
  }

  createwidgets() {
    this.newDevices.NewDevices.forEach((value) => {
      if (value.ProvisionStatus) {
        this.apiService.getZDeviceName().subscribe((result) => {
          this.devices = result;
          value.device = this.devices.find((deviceByName) => deviceByName._NwkId === value.NwkId);
          this.devicePaired.push(value);
        });
      }
    });
  }
}
