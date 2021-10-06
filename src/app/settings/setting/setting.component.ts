import { SimpleChanges } from '@angular/core';
import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { ControlContainer, FormBuilder, FormGroupDirective, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { Setting } from '@app/shared/models/setting';
import { TranslateService } from '@ngx-translate/core';

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
export class SettingComponent implements OnChanges {
  @Input() setting: Setting;
  @Input() advanced: boolean;
  list: { label: string; value: any }[] = [];

  constructor(private formBuilder: FormBuilder, private fgd: FormGroupDirective, private translate: TranslateService) {}

  ngOnChanges(changes: SimpleChanges): void {
    let group;
    if (changes.setting && changes.setting.currentValue) {
      this.setting = changes.setting.currentValue;
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
      this.fgd.form.get(this.setting.Name).get('current').patchValue(value);
    }
  }

  compareNumeric(a: any, b: string): boolean {
    if (isNaN(a.value)) {
      return a.value === b;
    } else {
      return a.value === Number(b);
    }
  }
}
