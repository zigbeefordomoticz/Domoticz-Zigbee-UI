import { Component, Input, OnInit } from '@angular/core';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { NgbActiveOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { fieldText, fieldValue, ParamValues, parsePluginParam } from './plugin-param';

// Handled by the Device enabled switch, never typed as a parameter
const DISABLED = 'Disabled';

interface Field {
  key: string;
  text: string;
  error: boolean;
}

/**
 * Side panel editing one device's Param: the Device enabled switch (Param "Disabled") and the other
 * parameters as fields or as JSON. Saving hands the JSON to `save` and closes on success only, so an
 * error leaves the edit in place.
 */
@Component({
  selector: 'app-device-param-editor',
  templateUrl: './device-param-editor.component.html',
  styleUrls: ['./device-param-editor.component.scss'],
  standalone: false
})
export class DeviceParamEditorComponent implements OnInit {
  @Input() device: DeviceByName;
  @Input() save: (param: string) => Observable<void>;

  enabled = true;
  fields: Field[] = [];
  tab: 'fields' | 'json' = 'fields';
  jsonText = '';
  jsonError = '';
  jsonCount = 0;
  newKey = '';
  addError = '';
  saving = false;
  // The plugin's value could not be read: shown as is in the JSON tab, to be fixed there
  unreadable = false;

  constructor(
    public offcanvas: NgbActiveOffcanvas,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const parsed = parsePluginParam(this.device.Param);
    if (parsed.values) {
      this.enabled = !parsed.values[DISABLED];
      this.fields = this.toFields(parsed.values);
    } else {
      this.unreadable = true;
      this.tab = 'json';
      this.jsonText = parsed.error;
      this.checkJson();
    }
  }

  get title(): string {
    return this.device.ZDeviceName || this.device.Model || this.device._NwkId;
  }

  get canSave(): boolean {
    return !this.saving && (this.tab === 'json' ? !this.jsonError : !this.fields.some(field => field.error));
  }

  showFields() {
    if (this.tab === 'fields') {
      return;
    }
    const values = this.readJson();
    if (values) {
      this.fields = this.toFields(values);
      this.tab = 'fields';
    }
  }

  showJson() {
    if (this.tab === 'json') {
      return;
    }
    const values = this.readFields();
    if (values) {
      this.jsonText = JSON.stringify(values, null, 2);
      this.jsonError = '';
      this.jsonCount = Object.keys(values).length;
      this.tab = 'json';
    }
  }

  checkField(field: Field) {
    try {
      fieldValue(field.text);
      field.error = false;
    } catch {
      field.error = true;
    }
  }

  remove(field: Field) {
    this.fields = this.fields.filter(other => other !== field);
  }

  add() {
    const key = this.newKey.trim();
    if (!key) {
      return;
    }
    if (key === DISABLED) {
      this.addError = this.translate.instant('device.byname.error.notify');
    } else if (this.fields.some(field => field.key === key)) {
      this.addError = this.translate.instant('device.param.add.exists', { key });
    } else {
      this.fields = [...this.fields, { key, text: '', error: false }];
      this.newKey = '';
      this.addError = '';
    }
  }

  checkJson() {
    this.jsonCount = Object.keys(this.readJson() ?? {}).length;
  }

  submit() {
    const values = this.tab === 'json' ? this.readJson() : this.readFields();
    if (!values || !this.canSave) {
      return;
    }
    this.saving = true;
    const param = JSON.stringify({ [DISABLED]: this.enabled ? 0 : 1, ...values });
    this.save(param).subscribe({
      next: () => this.offcanvas.close(param),
      // ApiService has toasted the error; the panel stays open with the edit
      error: () => (this.saving = false)
    });
  }

  private toFields(values: ParamValues): Field[] {
    return Object.keys(values)
      .filter(key => key !== DISABLED)
      .map(key => ({ key, text: fieldText(values[key]), error: false }));
  }

  private readFields(): ParamValues | null {
    this.fields.forEach(field => this.checkField(field));
    if (this.fields.some(field => field.error)) {
      return null;
    }
    const values: ParamValues = {};
    this.fields.forEach(field => (values[field.key] = fieldValue(field.text)));
    return values;
  }

  /** The JSON tab's text as parameters, or null with jsonError set. */
  private readJson(): ParamValues | null {
    let value: any;
    try {
      value = JSON.parse(this.jsonText);
    } catch (error) {
      this.jsonError = this.translate.instant('device.param.json.invalid', { error: (error as Error).message });
      return null;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      this.jsonError = this.translate.instant('device.param.json.object');
      return null;
    }
    if (DISABLED in value) {
      this.jsonError = this.translate.instant('device.byname.error.notify');
      return null;
    }
    this.jsonError = '';
    return value;
  }
}
