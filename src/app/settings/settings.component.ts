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

interface Card {
  // Unique per page: theme + group, or theme + "danger"
  id: string;
  group: string | null;
  danger: boolean;
  rows: Row[];
  // Advanced settings folded away in the Essentials view
  folded: Row[];
}

interface Block {
  theme: string;
  cards: Card[];
}

type Mode = 'essentials' | 'all';

// Order of the cards inside a section. A group the plugin adds later goes after these, by name.
const GROUP_ORDER = [
  'Internet',
  'Domoticz',
  'Features',
  'DevicePing',
  'GroupState',
  'Membership',
  'Remotes',
  'Backup',
  'Topology',
  'Radio',
  'GreenPower',
  'ManufacturerQuirks',
  'Diagnostics',
  'FirmwareUpdates',
  'Repositories',
  'PairingPace',
  'ManufacturerModes',
  'WebInterface',
  'MotionSelectors',
  'WidgetsLogging',
  'Health',
  'ReportingBinding',
  'OneTimeResets',
  'Coordinator',
  'GroupTransitions',
  'Storage',
  'Folders',
  'HTTPS',
  'Experimental'
];

// A section with at least this many cards gets an index of its cards
const INDEX_MIN_CARDS = 4;

const MODE_KEY = 'z4d.settings.mode';

/**
 * Settings: one section at a time, its settings grouped into cards, or the matches of a search or
 * filter across every section. A sticky bar lists what will be saved.
 *
 * The plugin may describe each setting with optional keys (Group, Unit, Min, Max, Step, DependsOn,
 * Danger, OneShot); an older plugin sends none, and each section is then one card.
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
  @ViewChild('contentDanger') contentDanger: TemplateRef<any>;

  themes: Settings[] = [];
  rows: Row[] = [];
  theme: string = null;
  search = '';
  mode: Mode = 'essentials';
  onlyChanged = false;
  onlyRestart = false;
  values: Record<string, any> = {};
  saving = false;
  reviewOpen = false;
  // Cards whose advanced settings, or whose danger settings, the user asked to see
  opened = new Set<string>();

  private initial: Record<string, any> = {};

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved === 'all' || saved === 'essentials') {
        this.mode = saved;
      }
    } catch {
      // No storage (private window): keep the default
    }
    this.load();
  }

  // Search or a filter: the matches of every section instead of the selected one
  get filtering(): boolean {
    return !!this.search.trim() || this.onlyChanged || this.onlyRestart;
  }

  get visibleThemes(): Settings[] {
    return this.themes.filter(theme => this.rows.some(row => row.theme === theme._Theme && this.isShown(row)));
  }

  get blocks(): Block[] {
    if (!this.filtering) {
      return this.theme ? [{ theme: this.theme, cards: this.cards(this.theme, this.rowsOf(this.theme), false) }] : [];
    }
    const term = this.search.trim().toLowerCase();
    const matches = this.rows.filter(
      row =>
        this.isShown(row) &&
        (!this.onlyChanged || this.differsFromDefault(row) || this.changed(row)) &&
        (!this.onlyRestart || this.level(row.setting) > 0) &&
        (!term || row.setting.Name.toLowerCase().includes(term) || this.label(row).toLowerCase().includes(term))
    );
    return this.themes
      .map(theme => ({ theme: theme._Theme, rows: matches.filter(row => row.theme === theme._Theme) }))
      .filter(block => block.rows.length)
      .map(block => ({ theme: block.theme, cards: this.cards(block.theme, block.rows, true) }));
  }

  get matchCount(): number {
    return this.blocks.reduce((sum, block) => sum + block.cards.reduce((n, card) => n + card.rows.length, 0), 0);
  }

  get changedFromDefault(): number {
    return this.rows.filter(row => this.isShown(row) && this.differsFromDefault(row)).length;
  }

  get changes(): Change[] {
    return this.rows
      .filter(row => this.changed(row))
      .map(row => ({ row, from: this.initial[row.setting.Name], to: this.values[row.setting.Name] }));
  }

  get restartChanges(): number {
    return this.changes.filter(change => this.level(change.row.setting) > 0).length;
  }

  // Highest restart level among the unsaved changes
  get impact(): number {
    return Math.max(0, ...this.changes.map(change => this.level(change.row.setting)));
  }

  get dangerChanges(): Change[] {
    return this.changes.filter(change => change.row.setting.Danger);
  }

  get valid(): boolean {
    return this.changes.every(change => this.isValid(change.row));
  }

  setMode(mode: Mode) {
    this.mode = mode;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // Remembered for this page only
    }
  }

  selectTheme(theme: string) {
    this.theme = theme;
    this.search = '';
    this.onlyChanged = false;
    this.onlyRestart = false;
  }

  clearFilters() {
    this.search = '';
    this.onlyChanged = false;
    this.onlyRestart = false;
  }

  changedIn(theme: string): number {
    return this.rows.filter(row => row.theme === theme && this.changed(row)).length;
  }

  showIndex(block: Block): boolean {
    return !this.filtering && block.cards.length >= INDEX_MIN_CARDS;
  }

  goTo(card: Card) {
    document.getElementById(card.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggle(card: Card) {
    if (this.opened.has(card.id)) {
      this.opened.delete(card.id);
    } else {
      this.opened.add(card.id);
    }
  }

  isOpen(card: Card): boolean {
    return this.opened.has(card.id);
  }

  // A danger card stays folded until asked for, unless one of its settings is changed or searched for
  isFolded(card: Card): boolean {
    return card.danger && !this.filtering && !this.isOpen(card) && !card.rows.some(row => this.changed(row));
  }

  groupLabel(card: Card): string {
    if (card.danger) {
      return this.translate.instant('settings.page.danger.title');
    }
    const key = 'settings.group.' + card.group;
    const text = this.translate.instant(key);
    return text === key ? card.group : text;
  }

  // Danger card: the group of each setting, shown when the card mixes several groups
  subGroup(card: Card, index: number): string | null {
    if (!card.danger) {
      return null;
    }
    const groups = new Set(card.rows.map(row => row.setting.Group ?? ''));
    const group = card.rows[index].setting.Group;
    if (groups.size < 2 || !group || (index > 0 && card.rows[index - 1].setting.Group === group)) {
      return null;
    }
    const key = 'settings.group.' + group;
    const text = this.translate.instant(key);
    return text === key ? group : text;
  }

  unit(setting: Setting): string {
    if (!setting.Unit) {
      return '';
    }
    const key = 'settings.unit.' + setting.Unit;
    const text = this.translate.instant(key);
    return text === key ? setting.Unit : text;
  }

  numeric(setting: Setting): boolean {
    return setting.DataType === 'int' || setting.DataType === 'float';
  }

  step(setting: Setting): number | string {
    return setting.Step ?? (setting.DataType === 'float' ? 'any' : 1);
  }

  range(setting: Setting): string {
    const unit = this.unit(setting);
    if (setting.Min !== undefined && setting.Max !== undefined) {
      return this.translate.instant('settings.page.range', { min: setting.Min, max: setting.Max, unit });
    }
    return '';
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
    this.reviewOpen = false;
  }

  isValid(row: Row): boolean {
    const value = this.values[row.setting.Name];
    const setting = row.setting;
    switch (setting.DataType) {
      case 'int':
      case 'float': {
        if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
          return false;
        }
        const number = Number(value);
        return (
          (setting.DataType === 'float' || Number.isInteger(number)) &&
          (setting.Min === undefined || number >= setting.Min) &&
          (setting.Max === undefined || number <= setting.Max)
        );
      }
      case 'hex':
        return /^[0-9A-Fa-f]+$/.test(String(value ?? ''));
      case 'url':
        return /^https?:\/\/\S+$/.test(String(value ?? ''));
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
    if (value === '' || value === null || value === undefined) {
      return '—';
    }
    const unit = this.unit(row.setting);
    return unit ? `${value} ${unit}` : String(value);
  }

  save() {
    if (this.dangerChanges.length) {
      this.modalService.open(this.contentDanger, { ariaLabelledBy: 'modal-danger-title' }).result.then(
        (confirmed: boolean) => {
          if (confirmed) {
            this.send();
          }
        },
        (): void => {
          // Cancelled: nothing is saved
        }
      );
      return;
    }
    this.send();
  }

  private send() {
    const body: Record<string, { current: any }> = {};
    this.changes.forEach(change => {
      const value = change.to;
      body[change.row.setting.Name] = { current: typeof value === 'boolean' ? (value ? 1 : 0) : value };
    });
    this.saving = true;
    this.apiService.putSettings(body as any).subscribe({
      next: () => {
        this.saving = false;
        this.reviewOpen = false;
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

  private rowsOf(theme: string): Row[] {
    return this.rows.filter(row => row.theme === theme && this.isShown(row));
  }

  // Hidden while the setting it depends on is off, unless it is changed. A parent the plugin did not
  // send (hidden, or not for this radio) hides nothing.
  private isShown(row: Row): boolean {
    const parent = row.setting.DependsOn;
    if (!parent || this.changed(row) || !(parent in this.values)) {
      return true;
    }
    return !!this.values[parent];
  }

  // The settings of one section as cards: one per Group (one in all when the plugin sends no Group),
  // then one Danger card. In the Essentials view, advanced settings fold into their card's footer.
  private cards(theme: string, rows: Row[], expanded: boolean): Card[] {
    const byGroup = new Map<string, Row[]>();
    const danger: Row[] = [];
    rows.forEach(row => {
      if (row.setting.Danger) {
        danger.push(row);
        return;
      }
      const group = row.setting.Group ?? '';
      byGroup.set(group, [...(byGroup.get(group) ?? []), row]);
    });

    const rank = (group: string) => {
      const index = GROUP_ORDER.indexOf(group);
      return index < 0 ? GROUP_ORDER.length : index;
    };
    const groups = [...byGroup.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

    const cards: Card[] = groups.map(group => {
      const id = `card-${theme}-${group || 'all'}`;
      const sorted = this.sort(byGroup.get(group));
      const essentials = expanded || this.mode === 'all' || this.opened.has(id);
      const rowsShown = essentials ? sorted : sorted.filter(row => !row.setting.Advanced || this.changed(row));
      return {
        id,
        group: group || null,
        danger: false,
        rows: rowsShown,
        folded: sorted.filter(row => !rowsShown.includes(row))
      };
    });

    if (danger.length) {
      const sorted = [...danger].sort(
        (a, b) =>
          rank(a.setting.Group ?? '') - rank(b.setting.Group ?? '') || a.setting.Name.localeCompare(b.setting.Name)
      );
      cards.push({ id: `card-${theme}-danger`, group: null, danger: true, rows: sorted, folded: [] });
    }
    return cards;
  }

  // Essentials first, then the advanced settings; each by name, as the plugin sends them
  private sort(rows: Row[]): Row[] {
    return [...rows].sort((a, b) => Number(a.setting.Advanced) - Number(b.setting.Advanced));
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
      case 'float':
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
