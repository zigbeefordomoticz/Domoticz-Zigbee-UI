import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Setting } from './setting';

const log = new Logger('SettingsComponent');

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  form: FormGroup;
  settings$: Observable<Array<Setting>>;

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private notifyService: NotifyService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      settings: this.formBuilder.group({})
    });

    this.settings$ = this.apiService.getSettings();
  }

  updateSettings() {
    if (this.form.invalid || !this.form.dirty) {
      this.form.markAsTouched();
      return;
    }
    this.apiService.putSettings(this.form.get('settings').value).subscribe((result: any) => {
      this.form.get('settings').markAsPristine();
      this.notifyService.notify();
    });
  }
}
