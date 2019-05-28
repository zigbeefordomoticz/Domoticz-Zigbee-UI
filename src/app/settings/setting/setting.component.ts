import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormBuilder, FormGroupDirective, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { TranslateService } from '@ngx-translate/core';
import { Setting } from '../setting';

const log = new Logger('SettingsComponent');

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective
    }
  ]
})
export class SettingComponent implements OnInit {
  @Input() setting: Setting;

  constructor(private formBuilder: FormBuilder, private fgd: FormGroupDirective, private translate: TranslateService) {}

  ngOnInit() {
    const group = this.formBuilder.group({
      current: ['', Validators.required]
    });

    this.fgd.form.addControl(this.setting.Name, group);
    const value = this.setting.current_value !== '' ? this.setting.current_value : this.setting.default_value;
    this.fgd.form
      .get(this.setting.Name)
      .get('current')
      .patchValue(value);
  }
}
