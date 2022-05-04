import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('UpdatePluginComponent');

@Component({
  selector: 'app-update-plugin',
  templateUrl: './update-plugin.component.html',
  styleUrls: ['./update-plugin.component.scss']
})
export class UpdatePluginComponent implements OnInit {
  message: string;
  load = false;

  constructor(
    private headerService: HeaderService,
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {}

  updatePlugin() {
    this.load = true;
    this.message = '';
    this.apiService.getUpgradePlugin().subscribe((result: any) => {
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
