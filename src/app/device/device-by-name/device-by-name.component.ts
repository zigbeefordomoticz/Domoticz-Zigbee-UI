import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

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
export class DeviceByNameComponent implements OnInit, OnChanges {
  @ViewChild('table') table: any;
  @Input() devices: DeviceByName[];
  rows: DeviceByName[] = [];
  json: any;
  temp: DeviceByName[] = [];
  hasEditing = false;
  rowToDelete: any;
  rowParameter: any;
  parameter: string;
  expanded: any = {};

  constructor(
    private apiService: ApiService,
    private translate: TranslateService,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.devices.currentValue !== changes.devices.previousValue) {
      this.json = this.devices;
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
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      result => {
        this.updateValue(this.parameter, 'Param', this.rowParameter._NwkId);
      },
      reason => {}
    );
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
    this.hasEditing = true;
    const rowUpdated = this.rows.find((row: any) => row._NwkId === nwkId);
    if (rowUpdated) {
      rowUpdated[col] = event.target.value;
    } else {
      log.error('row not found');
    }
  }

  updateDevices() {
    this.apiService.putZDeviceName(this.json).subscribe((result: any) => {
      log.debug(result);
      this.hasEditing = false;
      this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
    });
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    const temp = this.temp.filter(function (d: any) {
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
        widgets.forEach(function (value: string) {
          if (!ok && value) {
            ok = value.toLowerCase().indexOf(val) !== -1;
          }
        });
      }
      if (!ok && d.MacCapa) {
        const capas = d.MacCapa as Array<string>;
        capas.forEach(function (value: string) {
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

  toggleExpandRow(row: any) {
    this.table.rowDetail.toggleExpandRow(row);
  }
}
