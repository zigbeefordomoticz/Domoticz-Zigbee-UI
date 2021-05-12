import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormBuilder, FormGroupDirective, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { Setting } from '@app/shared/models/setting';

const log = new Logger('DebugSettingComponent');

@Component({
  selector: 'app-debug-setting',
  templateUrl: './debug-setting.component.html',
  styleUrls: ['./debug-setting.component.scss'],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective,
    },
  ],
})
export class DebugSettingComponent implements OnInit {
  @Input() setting: Setting;
  @Input() advanced: boolean;

  constructor(private formBuilder: FormBuilder, private fgd: FormGroupDirective) {}

  ngOnInit() {
    let group;
    if (this.setting.DataType === 'hex') {
      group = this.formBuilder.group({
        current: ['', Validators.compose([Validators.required, Validators.pattern('^[0-9A-Fa-f]+')])],
      });
    } else if (this.setting.DataType === 'bool') {
      group = this.formBuilder.group({
        current: [],
      });
    } else {
      group = this.formBuilder.group({
        current: ['', Validators.required],
      });
    }

    this.fgd.form.addControl(this.setting.Name, group);
    const value = this.setting.current_value !== '' ? this.setting.current_value : this.setting.default_value;
    this.fgd.form.get(this.setting.Name).get('current').patchValue(value);
  }
}
