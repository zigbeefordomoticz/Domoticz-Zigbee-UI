import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { Setting, Settings } from '@app/shared/models/setting';

const log = new Logger('SettingsComponent');

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  @ViewChild('contentRestart') contentRestart: any;
  @ViewChild('contentRestart') contentReset: any;
  @ViewChild('contentRestart') contentErase: any;
  form: FormGroup;
  settings: Array<Settings>;
  advanced = false;

  constructor(
    private modalService: NgbModal,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private headerService: HeaderService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({});
    this.apiService.getSettings().subscribe((res) => {
      this.settings = res;
      this.settings.sort((n1, n2) => n1._Order - n2._Order);
    });
  }

  reinitSettings() {
    this.settings.forEach((setting) => {
      const aSettings: Setting[] = [];
      setting.ListOfSettings.forEach((aSetting) => {
        if (aSetting.DataType !== 'path') {
          aSetting.current_value = aSetting.default_value;
        }
        aSettings.push(Object.assign({}, aSetting));
      });
      setting.ListOfSettings = aSettings;
    });
    this.settings = [...this.settings];
    this.form.markAsTouched();
  }

  advancedSettings(event: any) {
    if (event.currentTarget.checked) {
      this.advanced = true;
    } else {
      this.advanced = false;
    }
  }

  updateSettings() {
    if (this.form.invalid) {
      this.form.markAsTouched();
      return;
    }

    Object.keys(this.form.value).forEach((key) => {
      if (this.form.value[key].current === true) {
        this.form.value[key].current = 1;
      } else if (this.form.value[key].current === false) {
        this.form.value[key].current = 0;
      }
    });

    this.apiService.putSettings(this.form.value).subscribe((result: any) => {
      this.form.markAsPristine();
      this.toastr.success(this.translate.instant('api.global.succes.update.title'));
      this.apiService.getSettings().subscribe((res) => {
        this.settings = res;
        this.settings.sort((n1, n2) => n1._Order - n2._Order);
      });
      this.apiService.getRestartNeeded().subscribe((restart) => {
        if (restart.RestartNeeded === 1) {
          this.headerService.setRestart(true);
          this.open(this.contentRestart);
        } else if (restart.RestartNeeded === 2) {
          this.open(this.contentReset);
        } else if (restart.RestartNeeded === 3) {
          this.open(this.contentErase);
        }
      });
    });
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {},
      (reason) => {}
    );
  }

  hasBasicSettings(settings: Setting[]): boolean {
    if (this.advanced) {
      return true;
    } else {
      return settings.filter((setting) => setting.Advanced === false).length > 0;
    }
  }

  getTranslation(prefix: string, key: string): string {
    return this.translate.instant(prefix.concat(key));
  }
}
