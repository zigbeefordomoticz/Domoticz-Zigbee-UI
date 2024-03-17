import { Component } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-update-plugin',
  templateUrl: './update-plugin.component.html',
  styleUrls: ['./update-plugin.component.scss']
})
export class UpdatePluginComponent {
  message: string;
  load = false;

  constructor(
    private headerService: HeaderService,
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService,
    private spinner: NgxSpinnerService
  ) { }


  updatePlugin() {
    this.load = true;
    this.message = '';
    this.spinner.show('update-plugin');
    this.apiService
      .getUpgradePlugin()
      .pipe(finalize(() => this.spinner.hide('update-plugin')))
      .subscribe((result: any) => {
        this.load = false;
        this.message = result.result;
        if (result.ReturnCode === 0) {
          this.toastr.success(this.translate.instant('admin.plugin.update.success'));
          this.headerService.setRestart(true);
        } else {
          this.toastr.error(this.translate.instant('admin.plugin.update.error'));
        }
      });
  }
}
