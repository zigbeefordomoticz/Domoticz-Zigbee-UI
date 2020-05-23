import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Group, DeviceAvailable, DevicesAvailable } from '@app/shared/models/group';
import { HeaderService } from '@app/services/header-service';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { ToastrService } from 'ngx-toastr';
import { UnsubscribeOnDestroyAdapter } from '../shared/adapter/unsubscribe-adapter';

const log = new Logger('GroupComponent');

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  @ViewChild('content') content: any;
  form: FormGroup;
  rows: Array<Group> = [];
  rowsTemp: any[] = [];
  devices: Array<DeviceAvailable>;
  temp: any = [];
  hasEditing = false;
  waiting = false;

  constructor(
    private modalService: NgbModal,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private toastr: ToastrService,
    private headerService: HeaderService
  ) {
    super();
  }

  ngOnInit() {
    this.apiService.getZGroupDevicesAvalaible().subscribe((devices: Array<DevicesAvailable>) => {
      const devicesToAdd: Array<DeviceAvailable> = [];
      if (devices && devices.length > 0) {
        devices.forEach(device => {
          device.WidgetList.forEach(widget => {
            if (device._NwkId !== '0000') {
              const deviceToAdd: DeviceAvailable = new DeviceAvailable();
              deviceToAdd.Ep = widget.Ep;
              deviceToAdd.IEEE = widget.IEEE;
              deviceToAdd.Name = widget.Name;
              deviceToAdd.ZDeviceName = widget.ZDeviceName;
              deviceToAdd._ID = widget._ID;
              deviceToAdd._NwkId = device._NwkId;
              devicesToAdd.push(deviceToAdd);
            }
          });
        });
        this.devices = [...devicesToAdd];
      }
    });
    this.getGroups();
  }

  updateValue(event: any, GroupId: string) {
    this.hasEditing = true;
    const rowUpdated = this.rows.find((row: any) => row._GroupId === GroupId);
    rowUpdated.GroupName = event.target.value;
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    const temp = this.temp.filter(function(d: any) {
      let ok = false;
      if (d._GroupId) {
        ok = d._GroupId.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.GroupName) {
        ok = d.GroupName.toLowerCase().indexOf(val) !== -1;
      }
      return ok || !val;
    });
    this.rows = temp;
    this.table.offset = 0;
  }

  updateDevices() {
    this.rows.forEach(group => {
      if (group.coordinatorInside) {
        if (!group.devicesSelected) {
          group.devicesSelected = [];
        }
        group.devicesSelected.push({ Ep: '01', _NwkId: '0000' });
      }
    });

    if (this.isFormValid) {
      this.apiService.putZGroups(this.rows).subscribe(result => {
        log.debug(this.rows);
        this.hasEditing = false;
        this.toastr.success(this.translate.instant('api.global.succes.update.title'));
        this.apiService.getRestartNeeded().subscribe(restart => {
          if (restart.RestartNeeded) {
            this.headerService.setRestart(true);
            this.open(this.content);
          }
        });

        this.waiting = true;
        setTimeout(() => {
          this.getGroups();
          this.waiting = false;
        }, 1000);
      });
    }
  }

  delete(row: Group) {
    const index = this.rows.indexOf(row, 0);
    if (index > -1) {
      this.rows.splice(index, 1);
      this.rows = [...this.rows];
      this.temp = [...this.rows];
    }
  }

  add() {
    const group = new Group();
    group.GroupName = '';
    group.coordinatorInside = false;
    this.rows.push(group);
    this.rows = [...this.rows];
    this.temp = [...this.rows];
  }

  updateCoordinator(event: any, row: Group) {
    row.coordinatorInside = event.currentTarget.checked;
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      result => {},
      reason => {}
    );
  }

  isFormValid(): boolean {
    let retour = true;
    this.rows.forEach(group => {
      if (!group.GroupName) {
        retour = false;
        return;
      }
      if (!group.coordinatorInside && (!group.devicesSelected || group.devicesSelected.length === 0)) {
        retour = false;
        return;
      }
    });

    return !this.waiting && retour;
  }

  private getGroups() {
    this.apiService.getZGroups().subscribe((groups: Array<Group>) => {
      if (groups && groups.length > 0) {
        groups.forEach(group => {
          const devicesSelected: any[] = [];
          group.coordinatorInside = false;
          group.Devices.forEach(device => {
            if (device._NwkId === '0000') {
              group.coordinatorInside = true;
            } else {
              const deviceAvailable = this.devices.find(x => x._NwkId === device._NwkId && x.Ep === device.Ep);
              if (deviceAvailable !== null && deviceAvailable !== undefined) {
                devicesSelected.push(deviceAvailable);
              }
            }
          });
          group.devicesSelected = devicesSelected;
        });
        this.rows = [...groups];
        this.temp = [...groups];
      }
    });
  }
}
