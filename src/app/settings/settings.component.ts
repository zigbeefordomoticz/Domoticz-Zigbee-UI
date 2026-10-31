import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { Setting, Settings } from '@app/shared/models/setting';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

interface Row {
  setting: Setting;
  theme: string;
  options: { label: string; value: any }[];
}

interface Change {
  row: Row;
  from: any;
  to: any;
}

/**
 * Settings: one theme at a time (or the matches of a search across all themes), each setting with
 * its control, and a review panel of what will be saved.
 *
 * Only the changed settings are sent to PUT /setting, as { Name: { current } }; the plugin
 * handles each key on its own. A setting's restart_need says what saving it implies:
 * 1 restart the plugin, 2 reset the coordinator, 3 erase its PDM (true counts as 1).
 */
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: false
})
export class SettingsComponent implements OnInit {
  @ViewChild('contentRestart') contentRestart: TemplateRef<any>;
  @ViewChild('contentReset') contentReset: TemplateRef<any>;
  @ViewChild('contentErase') contentErase: TemplateRef<any>;

  themes: Settings[] = [];
  rows: Row[] = [];
  theme: string = null;
  search = '';
  advanced = false;
  values: Record<string, any> = {};
  saving = false;

  private initial: Record<string, any> = {};

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.load();
  }

  get visibleThemes(): Settings[] {
    return this.themes.filter(theme => this.visible(theme._Theme).length > 0);
  }

  get shown(): Row[] {
    const term = this.search.trim().toLowerCase();
    if (term) {
      return this.rows.filter(
        row =>
          this.isVisible(row) &&
          (row.setting.Name.toLowerCase().includes(term) || this.label(row).toLowerCase().includes(term))
      );
    }
    return this.visible(this.theme);
  }

  get changes(): Change[] {
    return this.rows
      .filter(row => this.changed(row))
      .map(row => ({ row, from: this.initial[row.setting.Name], to: this.values[row.setting.Name] }));
  }

  // Highest restart level among the unsaved changes
  get impact(): number {
    return Math.max(0, ...this.changes.map(change => this.level(change.row.setting)));
  }

  get valid(): boolean {
    return this.changes.every(change => this.isValid(change.row));
  }

  selectTheme(theme: string) {
    this.theme = theme;
    this.search = '';
  }

  changedIn(theme: string): number {
    return this.rows.filter(row => row.theme === theme && this.changed(row)).length;
  }

  changed(row: Row): boolean {
    return String(this.values[row.setting.Name]) !== String(this.initial[row.setting.Name]);
  }

  differsFromDefault(row: Row): boolean {
    return (
      row.setting.DataType !== 'path' &&
      String(this.values[row.setting.Name]) !== String(this.normalize(row.setting, row.setting.default_value))
    );
  }

  resetToDefault(row: Row) {
    this.values[row.setting.Name] = this.normalize(row.setting, row.setting.default_value);
  }

  // As the former "Settings (default)" button: every setting but paths, nothing saved yet
  allToDefaults() {
    this.rows.filter(row => row.setting.DataType !== 'path').forEach(row => this.resetToDefault(row));
  }

  discard() {
    this.values = { ...this.initial };
  }

  isValid(row: Row): boolean {
    const value = this.values[row.setting.Name];
    switch (row.setting.DataType) {
      case 'int':
        return value !== null && value !== '' && !isNaN(Number(value));
      case 'hex':
        return /^[0-9A-Fa-f]+$/.test(String(value ?? ''));
      case 'list':
        return value !== null && value !== undefined;
      default:
        return true;
    }
  }

  level(setting: Setting): number {
    const restart: any = setting.restart_need;
    return restart === true ? 1 : Number(restart) || 0;
  }

  label(row: Row): string {
    return this.translate.instant(row.setting.Name);
  }

  display(row: Row, value: any): string {
    if (row.setting.DataType === 'bool') {
      return this.translate.instant(value ? 'settings.page.on' : 'settings.page.off');
    }
    if (row.setting.DataType === 'list') {
      return row.options.find(option => String(option.value) === String(value))?.label ?? String(value);
    }
    return value === '' || value === null || value === undefined ? '—' : String(value);
  }

  save() {
    const body: Record<string, { current: any }> = {};
    this.changes.forEach(change => {
      const value = change.to;
      body[change.row.setting.Name] = { current: typeof value === 'boolean' ? (value ? 1 : 0) : value };
    });
    this.saving = true;
    this.apiService.putSettings(body as any).subscribe({
      next: () => {
        this.saving = false;
        this.toastr.success(this.translate.instant('api.global.succes.saved.notify'));
        this.load();
        this.apiService.getRestartNeeded().subscribe(restart => this.askRestart(restart?.RestartNeeded));
      },
      error: () => (this.saving = false)
    });
  }

  private askRestart(level: number) {
    if (level === 1) {
      this.headerService.setRestart(true);
      this.modalService.open(this.contentRestart, { ariaLabelledBy: 'modal-basic-title' });
    } else if (level === 2) {
      this.modalService.open(this.contentReset, { ariaLabelledBy: 'modal-basic-title' });
    } else if (level === 3) {
      this.modalService.open(this.contentErase, { ariaLabelledBy: 'modal-basic-title' });
    }
  }

  private load() {
    this.apiService.getSettings().subscribe(themes => {
      this.themes = [...(themes ?? [])].sort((a, b) => a._Order - b._Order);
      this.rows = [];
      this.initial = {};
      this.themes.forEach(theme =>
        theme.ListOfSettings.forEach(setting => {
          this.rows.push({ setting, theme: theme._Theme, options: this.options(setting) });
          const value = setting.current_value !== '' ? setting.current_value : setting.default_value;
          this.initial[setting.Name] = this.normalize(setting, value);
        })
      );
      this.values = { ...this.initial };
      if (!this.theme || !this.visibleThemes.some(theme => theme._Theme === this.theme)) {
        this.theme = this.visibleThemes[0]?._Theme ?? null;
      }
    });
  }

  private visible(theme: string): Row[] {
    return this.rows.filter(row => row.theme === theme && this.isVisible(row));
  }

  private isVisible(row: Row): boolean {
    return this.advanced || !row.setting.Advanced || this.changed(row);
  }

  private options(setting: Setting): { label: string; value: any }[] {
    return setting.DataType === 'list'
      ? (setting.list ?? []).map(item => ({ label: Object.keys(item)[0], value: Object.values(item)[0] }))
      : [];
  }

  private normalize(setting: Setting, value: any): any {
    switch (setting.DataType) {
      case 'bool':
        return value === true || value === 1 || value === '1' || value === 'true';
      case 'int':
        return value === '' || value === null || value === undefined ? value : Number(value);
      case 'list': {
        // The plugin sends the value as stored: match it to an option of the same text
        const option = this.options(setting).find(item => String(item.value) === String(value));
        return option ? option.value : value;
      }
      default:
        return value === null || value === undefined ? '' : String(value);
    }
  }
}
