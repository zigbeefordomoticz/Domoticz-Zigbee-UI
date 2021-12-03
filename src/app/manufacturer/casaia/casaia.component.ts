import { Component, OnInit, ViewChild } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { CasaiaDevice, UpdateCasaiaDevice } from '@app/shared/models/casaia-device';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('CasaiaComponent');

@Component({
  selector: 'app-manufacturer-casaia',
  templateUrl: './casaia.component.html',
  styleUrls: ['./casaia.component.scss']
})
export class CasaiaComponent implements OnInit {
  @ViewChild('table') table: any;
  rows: CasaiaDevice[];
  temp: CasaiaDevice[] = [];
  hasEditing = false;

  constructor(private apiService: ApiService, private toastr: ToastrService, private translate: TranslateService) {}

  ngOnInit() {
    this.getCasaiaDevices();
  }

  updateIRCode(event: any, nwkId: string) {
    this.hasEditing = true;
    const rowUpdated = this.rows.find((row: any) => row.NwkId === nwkId);
    rowUpdated.IRCode = event.target.value;
  }

  updateCasaiaDevices() {
    const update: UpdateCasaiaDevice[] = [];
    this.rows.forEach(row => {
      update.push(new UpdateCasaiaDevice(row.IRCode, row.NwkId));
    });

    this.apiService.putCasiaIrcode(update).subscribe((result: any) => {
      this.hasEditing = false;
      this.getCasaiaDevices();
      this.toastr.success(this.translate.instant('api.global.succes.update.notify'));
    });
  }

  updateFilter(event: any) {
    const val = event.target.value.toLowerCase();
    const temp = this.temp.filter(function (d: any) {
      let ok = false;
      if (d.Model) {
        ok = d.Model.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.NwkId) {
        ok = d.NwkId.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.IEEE) {
        ok = d.IEEE.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.Name) {
        ok = d.Name.toLowerCase().indexOf(val) !== -1;
      }
      if (!ok && d.IRCode) {
        ok = d.IRCode.toLowerCase().indexOf(val) !== -1;
      }
      return ok || !val;
    });

    this.rows = temp;
    this.table.offset = 0;
  }

  private getCasaiaDevices() {
    this.apiService.getCasiaDevices().subscribe(devices => {
      this.rows = devices;
      this.temp = [...this.rows];
    });
  }
}
