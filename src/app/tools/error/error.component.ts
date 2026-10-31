import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { FileSaverService } from 'ngx-filesaver';
import { ToastrService } from 'ngx-toastr';
import { redact } from '../support-bundle';

interface ErrorEntry {
  time: number;
  module: string;
  thread: string;
  nwkid: string;
  message: string;
  health: string;
  permitToJoin: any;
  code: string | null;
  context: any;
  device: { name: string; model: string; manufacturer: string } | null;
}

interface Session {
  start: number | null;
  plugin: string;
  firmware: string;
  errors: ErrorEntry[];
}

/**
 * Tools → Errors: the plugin's error history (/log-error-history), grouped by plugin start, newest
 * first, with a detail panel and a copy ready to paste in a GitHub issue.
 *
 * The plugin keeps 20 errors per start, 5 starts, 7 days (LoggingManagement.py on stable9). Reading
 * the history marks the errors as read, as the former page did on its button: opening this tab does.
 * Downloads and copies go through redact(): an entry may carry the device record.
 */
@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
  standalone: false
})
export class ErrorComponent implements OnInit {
  @ViewChild('detail') detailRef: ElementRef<HTMLElement>;
  @ViewChild('clearModal') clearModal: TemplateRef<any>;

  sessions: Session[] = [];
  raw: any = null;
  loaded = false;
  search = '';
  module = '';
  selected: ErrorEntry = null;
  selectedSession: Session = null;

  constructor(
    private apiService: ApiService,
    private headerService: HeaderService,
    private modalService: NgbModal,
    private fileSaverService: FileSaverService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.load();
  }

  get modules(): string[] {
    return [...new Set(this.sessions.flatMap(session => session.errors.map(error => error.module)))]
      .filter(name => name)
      .sort();
  }

  get count(): number {
    return this.sessions.reduce((total, session) => total + session.errors.length, 0);
  }

  shown(session: Session): ErrorEntry[] {
    const text = this.search.trim().toLowerCase();
    return session.errors.filter(
      error =>
        (!this.module || error.module === this.module) &&
        (!text ||
          [error.message, error.module, error.nwkid, error.code, error.device?.name, error.device?.model].some(value =>
            value?.toLowerCase().includes(text)
          ))
    );
  }

  select(session: Session, error: ErrorEntry) {
    this.selected = error;
    this.selectedSession = session;
    // On a phone the detail comes after the list: bring it into sight
    setTimeout(() => {
      const detail = this.detailRef?.nativeElement;
      if (detail && detail.getBoundingClientRect().top > window.innerHeight) {
        detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  load() {
    this.apiService.getLogErrorHistory().subscribe(history => {
      this.raw = history;
      this.sessions = this.parse(history);
      this.loaded = true;
      this.headerService.setError(false);
      const first = this.sessions.find(session => session.errors.length);
      if (first && !this.selected) {
        this.select(first, first.errors[0]);
      }
    });
  }

  download() {
    const blob = new Blob([JSON.stringify(redact(this.raw ?? {}), null, 2)], {
      type: this.fileSaverService.genType('z4d-errors.json')
    });
    this.fileSaverService.save(blob, 'z4d-errors.json');
  }

  // Markdown for a GitHub issue: what happened, where, with which versions; no device record
  copyIssue() {
    const error = this.selected;
    const session = this.selectedSession;
    const lines = [
      `**Error**: ${error.message}`,
      '',
      `- Time: ${new Date(error.time * 1000).toISOString()}`,
      `- Module: ${error.module} (thread ${error.thread})`,
      error.code ? `- Error code: ${error.code}` : null,
      error.nwkid
        ? `- Device: ${error.nwkid}${error.device ? ` · ${error.device.model} · ${error.device.manufacturer}` : ''}`
        : null,
      `- Plugin: ${session?.plugin || '?'} · coordinator firmware ${session?.firmware || '?'}`,
      `- Plugin health: ${error.health} · pairing open: ${error.permitToJoin ? 'yes' : 'no'}`,
      error.context ? ['', '```json', JSON.stringify(redact(error.context), null, 2), '```'].join('\n') : null
    ].filter(line => line !== null);
    navigator.clipboard
      ?.writeText(lines.join('\n'))
      .then(() => this.toastr.success(this.translate.instant('tools.errors.copied')));
  }

  confirmClear() {
    // Dismissed (Cancel, ✕, Escape): nothing to do
    this.modalService.open(this.clearModal, { ariaLabelledBy: 'clear-title' }).result.then(
      () =>
        this.apiService.clearLogErrorHistory().subscribe(() => {
          this.toastr.success(this.translate.instant('tools.errors.cleared'));
          this.selected = null;
          this.load();
        }),
      (): void => undefined
    );
  }

  contextText(error: ErrorEntry): string {
    return typeof error.context === 'string' ? error.context : JSON.stringify(error.context, null, 2);
  }

  private parse(history: any): Session[] {
    if (!history || typeof history !== 'object') {
      return [];
    }
    const numbered = (object: any) =>
      Object.keys(object)
        .filter(key => /^\d+$/.test(key))
        .map(key => object[key])
        .filter(value => value && typeof value === 'object');
    return numbered(history)
      .map(session => ({
        start: session.StartTime ?? null,
        plugin: session.PluginVersion ?? '',
        firmware: [session.FirmwareMajorVersion, session.FirmwareVersion].filter(part => part).join(' '),
        errors: numbered(session)
          .filter(entry => 'message' in entry)
          .map(entry => this.entry(entry))
          .sort((a, b) => b.time - a.time)
      }))
      .filter(session => session.errors.length)
      .sort((a, b) => (b.start ?? b.errors[0].time) - (a.start ?? a.errors[0].time));
  }

  private entry(entry: any): ErrorEntry {
    const context = entry.context ?? null;
    const code = context && typeof context === 'object' ? (context['Error code'] ?? null) : null;
    const info = entry.DeviceInfos;
    return {
      time: entry.Time ?? 0,
      module: entry.Module ?? '',
      thread: entry.Thread ?? '',
      nwkid: entry.nwkid ?? '',
      message: String(entry.message ?? ''),
      health: entry.PluginHealth ?? '',
      permitToJoin: entry.PermitToJoin,
      code,
      context,
      device: info
        ? {
            name: info.ZDeviceName ?? '',
            model: info.Model ?? '',
            manufacturer: info.Manufacturer ?? info.MacCapa ?? ''
          }
        : null
    };
  }
}
