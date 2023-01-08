import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Table } from 'primeng/table';

const log = new Logger('DeviceByNameComponent');

@Component({
  selector: 'app-device-by-name',
  templateUrl: './device-by-name.component.html',
  styleUrls: ['./device-by-name.component.scss']
})
export class DeviceByNameComponent implements OnInit, OnChanges {
  @Input() devices: DeviceByName[];
  rows: DeviceByName[] = [];
  temp: DeviceByName[] = [];
  hasEditing = false;
  rowToDelete: any;
  rowParameter: DeviceByName;
  parameter: string;
  expanded: any = {};
  enabled = false;
  prefixEnabled = 'Disabled';
  enabledTrue = "'Disabled': 0";
  enabledFalse = "'Disabled': 1";

  constructor(
    private apiService: ApiService,
    private translate: TranslateService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private clipboard: Clipboard
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.devices.currentValue !== changes.devices.previousValue) {
      this.devices = this.devices;
      this.rows = this.devices;
      this.temp = [...this.rows];
    }
  }

  ngOnInit() {}

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      result => {
        this.delete();
      },
      reason => {}
    );
  }

  editParameter(content: any): void {
    this.parameter = this.rowParameter.Param;

    this.enabled = !this.parameter.includes(this.enabledFalse);
    if (this.enabled) {
      this.parameter = this.parameter.replace(this.enabledTrue.concat(','), '');
      this.parameter = this.parameter.replace(this.enabledTrue, '');
    } else {
      this.parameter = this.parameter.replace(this.enabledFalse.concat(','), '');
      this.parameter = this.parameter.replace(this.enabledFalse, '');
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(result => {
      if (this.parameter.includes(this.prefixEnabled)) {
        this.toastr.error(this.translate.instant('device.byname.error.notify'));
      } else {
        if (this.enabled) {
          this.parameter = this.parameter.replace('{', '{'.concat(this.enabledTrue).concat(', '));
        } else {
          this.parameter = this.parameter.replace('{', '{'.concat(this.enabledFalse).concat(', '));
        }
        this.updateValueJson(this.parameter, 'Param', this.rowParameter._NwkId);
      }
    });
  }

  onChangeEnabled() {
    this.enabled = !this.enabled;
  }

  delete() {
    this.apiService.deleteZDeviceName(this.rowToDelete._NwkId).subscribe(() => {
      const index = this.rows.indexOf(this.rowToDelete, 0);
      this.rowToDelete = null;
      if (index > -1) {
        this.rows.splice(index, 1);
        this.rows = [...this.rows];
        this.temp = [...this.rows];
      }
    });
  }

  updateValue(event: any, col: string, nwkId: string) {
    this.updateValueJson(event.target.value, col, nwkId);
  }

  private updateValueJson(value: any, col: string, nwkId: string): void {
    this.hasEditing = true;
    const rowUpdated = this.rows.find((row: any) => row._NwkId === nwkId);
    if (rowUpdated) {
      rowUpdated[col] = value;
    } else {
      log.error('row not found');
    }
  }

  updateDevices() {
    this.apiService.putZDeviceName(this.rows).subscribe((result: any) => {
      log.debug(result);
      this.hasEditing = false;
      this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
    });
  }

  copy(row: DeviceByName) {
    this.apiService.getRawZDevice(row._NwkId).subscribe(json => this.clipboard.copy(JSON.stringify(json)));
  }
}
