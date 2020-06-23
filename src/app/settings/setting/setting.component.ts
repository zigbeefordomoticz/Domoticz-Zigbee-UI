import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormBuilder, FormGroupDirective, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { TranslateService } from '@ngx-translate/core';
import { Setting } from '@app/shared/models/setting';
import { KeyValue } from '@angular/common';

const log = new Logger('SettingComponent');

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
  @Input() advanced: boolean;
  list: { label: string; value: any }[] = [];

  constructor(private formBuilder: FormBuilder, private fgd: FormGroupDirective, private translate: TranslateService) {}

  ngOnInit() {
    let group;
    if (this.setting.DataType === 'hex') {
      group = this.formBuilder.group({
        current: ['', Validators.compose([Validators.required, Validators.pattern('^[0-9A-Fa-f]+')])]
      });
    } else if (this.setting.DataType === 'bool') {
      group = this.formBuilder.group({
        current: []
      });
    } else if (this.setting.DataType === 'list') {
      group = this.formBuilder.group({
        current: [null, Validators.required]
      });

      this.list = [];
      this.setting.list.forEach(v => {
        const key = Object.keys(v)[0];
        const valeur = Object.values(v)[0];
        this.list.push({ label: key, value: valeur });
      });
    } else {
      group = this.formBuilder.group({
        current: ['', Validators.required]
      });
    }

    this.fgd.form.addControl(this.setting.Name, group);
    const value = this.setting.current_value !== '' ? this.setting.current_value : this.setting.default_value;
    this.fgd.form
      .get(this.setting.Name)
      .get('current')
      .patchValue(value);
  }
}
