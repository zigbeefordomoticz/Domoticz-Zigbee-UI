import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Setting } from '@app/shared/models/setting';

const log = new Logger('SettingsComponent');

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  @ViewChild('content') content: any;
  form: FormGroup;
  settings$: Observable<Array<Setting>>;

  constructor(
    private modalService: NgbModal,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private notifyService: NotifyService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({});
    this.settings$ = this.apiService.getSettings();
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
      this.settings$ = this.apiService.getSettings();
      this.apiService.getRestartNeeded().subscribe(restart => {
        if (restart.RestartNeeded) {
          this.open(this.content);
        }
      });
    });
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(result => {}, reason => {});
  }
}
