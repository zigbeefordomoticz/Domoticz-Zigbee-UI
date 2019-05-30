import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { PushNotificationsService } from 'ng-push';
import { Group, Device, DeviceAvailable, DevicesAvailable } from './group';
import { NotifyService } from '@app/services/notify.service';

const log = new Logger('CreateGroupComponent');

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnInit {
  @ViewChild('table') table: any;
  form: FormGroup;
  rows: Array<Group>;
  rowsTemp: any[] = [];
  editing = {};
  devices: Array<DeviceAvailable>;
  temp: any = [];
  hasEditing = false;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private notifyService: NotifyService
  ) {}

  ngOnInit() {
    this.apiService.getZGroupDevicesAvalaible().subscribe((devices: Array<DevicesAvailable>) => {
      const devicesToAdd: Array<DeviceAvailable> = [];
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
      this.apiService.getZGroups().subscribe((groups: Array<Group>) => {
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
      });
    });
  }

  updateValue(event: any, cell: any, rowIndex: any) {
    this.hasEditing = true;
    log.debug('inline editing rowIndex', rowIndex);
    this.editing[rowIndex + '-' + cell] = false;
    this.rows[rowIndex][cell] = event.target.value;
    this.rows = [...this.rows];
    log.debug('UPDATED!', this.rows[rowIndex][cell]);
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
    this.hasEditing = false;

    this.rows.forEach(group => {
      if (group.coordinatorInside) {
        group.devicesSelected.push({ Ep: '01', _NwkId: '0000' });
      }
    });

    this.apiService.putZGroups(this.rows).subscribe(result => {
      log.debug(this.rows);
      this.notifyService.notify();
    });
  }

  delete(row: Group, rowIndex: number) {
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
    this.rows.push(group);
    this.rows = [...this.rows];
    this.temp = [...this.rows];
  }
}
