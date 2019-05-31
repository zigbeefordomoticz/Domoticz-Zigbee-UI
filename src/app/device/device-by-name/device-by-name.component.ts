import { Component, OnInit, ViewChild } from '@angular/core';
import { ControlContainer, FormBuilder, FormGroup, FormGroupDirective } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { DeviceByName } from './device-by-name';
import { PushNotificationsService } from 'ng-push';
import { NotifyService } from '@app/services/notify.service';

const log = new Logger('DeviceByNameComponent');

@Component({
  selector: 'app-device-by-name',
  templateUrl: './device-by-name.component.html',
  styleUrls: ['./device-by-name.component.scss'],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective
    }
  ]
})
export class DeviceByNameComponent implements OnInit {
  @ViewChild('table') table: any;
  form: FormGroup;
  devices: Array<DeviceByName> = [];
  rows: any = [];
  editing = {};
  json: any;
  temp: Array<DeviceByName> = [];
  hasEditing = false;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private fgd: FormGroupDirective,
    private translate: TranslateService,
    private notifyService: NotifyService
  ) {}

  ngOnInit() {
    this.apiService.getZDeviceName().subscribe((result: any) => {
      this.json = result;
      this.devices = result;
      this.rows = this.devices;
      this.temp = [...this.rows];
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

  updateDevices() {
    this.apiService.putZDeviceName(this.json).subscribe((result: any) => {
      log.debug(result);
      this.hasEditing = false;
      this.notifyService.notify();
    });
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    const temp = this.temp.filter(function(d: any) {
      let ok = false;
      if (d.Model) {
        ok = d.Model.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.ZDeviceName) {
        ok = d.ZDeviceName.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d._NwkId) {
        ok = d._NwkId.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.Status) {
        ok = d.Status.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.IEEE) {
        ok = d.IEEE.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.WidgetList) {
        const widgets = d.WidgetList as Array<string>;
        widgets.forEach(function(value: string) {
          if (!ok && value) {
            ok = value.toLowerCase().indexOf(val) !== -1;
          }
        });
      }
      if (!ok && d.MacCapa) {
        const capas = d.MacCapa as Array<string>;
        capas.forEach(function(value: string) {
          if (!ok && value) {
            ok = value.toLowerCase().indexOf(val) !== -1;
          }
        });
      }
      return ok || !val;
    });

    this.rows = temp;
    this.table.offset = 0;
  }
}
