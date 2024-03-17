import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { Configure } from '@app/shared/models/configure-reporting';
import { ZDevices } from '@app/shared/models/device';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-configure-reporting',
  templateUrl: './configure.component.html',
  styleUrls: ['./configure.component.scss']
})
export class ConfigureReportingComponent implements OnInit {
  devices$: Observable<ZDevices[]>;
  clusters$: Observable<Configure[]>;
  deviceSelected: string;
  form: FormGroup;
  clustersToSave: Configure[];
  permitToValidate = false;

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.devices$ = this.apiService.getZDevices();
  }

  getConfiguration(event: ZDevices): void {
    this.deviceSelected = null;
    if (event) {
      this.deviceSelected = event._NwkId;
      this.clusters$ = this.apiService.getConfigureReporting(this.deviceSelected);
    }
  }

  putConfiguration(): void {
    this.apiService.putConfigureReporting(this.deviceSelected, this.clustersToSave).subscribe(() => {
      this.permitToValidate = false;
      this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
    });
  }

  resetConfiguration(): void {
    this.apiService.deleteConfigureReporting(this.deviceSelected).subscribe(() => {
      this.permitToValidate = false;
      this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
    });
  }

  triggerConfiguration(): void {
    this.apiService.getTriggerConfigureReporting(this.deviceSelected).subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
    });
  }

  onClustersChange(clusters: Configure[]) {
    this.permitToValidate = false;
    this.clustersToSave = null;
    if (clusters) {
      this.permitToValidate = true;
      this.clustersToSave = clusters;
    }
  }
}
