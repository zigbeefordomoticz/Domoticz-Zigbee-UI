import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { NotifyService } from '@app/services/notify.service';
import { Settings, Setting } from '@app/shared/models/setting';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

const log = new Logger('SettingsComponent');

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  @ViewChild('content', { static: false }) content: any;
  form: FormGroup;
  settings: Array<Settings>;
  advanced = false;

  constructor(
    private modalService: NgbModal,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private notifyService: NotifyService,
    private headerService: HeaderService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({});
    this.apiService.getSettings().subscribe(res => {
      this.settings = res;
      this.settings.sort((n1, n2) => n1._Order - n2._Order);
    });
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

    Object.keys(this.form.value).forEach(key => {
      if (this.form.value[key].current === true) {
        this.form.value[key].current = 1;
      } else if (this.form.value[key].current === false) {
        this.form.value[key].current = 0;
      }
    });

    this.apiService.putSettings(this.form.value).subscribe((result: any) => {
      this.form.markAsPristine();
      this.notifyService.notify();
      this.apiService.getSettings().subscribe(res => {
        this.settings = res;
        this.settings.sort((n1, n2) => n1._Order - n2._Order);
      });
      this.apiService.getRestartNeeded().subscribe(restart => {
        if (restart.RestartNeeded) {
          this.headerService.setRestart(true);
          this.open(this.content);
        }
      });
    });
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(result => {}, reason => {});
  }

  hasBasicSettings(settings: Setting[]): boolean {
    if (this.advanced) {
      return true;
    } else {
      return settings.filter(setting => setting.Advanced === false).length > 0;
    }
  }
}
