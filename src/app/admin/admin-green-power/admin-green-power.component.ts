import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { ZgpModel, ZgpPairing, ZgpPairingEvent } from '@app/shared/models/zgp-pairing';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { timer } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';
import { pairingLeft } from '../pairing-state.service';

// Pairing feed: every 2 s while the window is open, every 10 s otherwise
const POLL_PERIOD = 2000;
const IDLE_TICKS = 5;
const LOG_LINES = 200;
const GP_WINDOW = 240;

type JoinedStatus = 'joining' | 'inDB' | 'Unexpected' | 'removed';

// The pairing steps of the feed, as the status of a device that joined
const STATUS_OF_EVENT: Partial<Record<ZgpPairingEvent['Event'], JoinedStatus>> = {
  commissioned: 'joining',
  widgets: 'inDB',
  'no-widget': 'Unexpected',
  removed: 'removed'
};

interface JoinedGpd {
  ieee: string;
  srcId: string;
  status: JoinedStatus;
  // /zgp-device-raw/<ieee>: model, device type, widgets
  record?: any;
}

/**
 * Admin → Provisionning → Zigbee Green Power: pair a Green Power device.
 *
 * Most Green Power devices tell nothing about themselves when they pair, so the user picks the device
 * type first (/zgp-models, Conf/ZGPmodel of the plugin). Open sends PUT /zgp-pairing, which opens
 * Green Power commissioning only, not the Zigbee network. /zgp-pairing/<seq> is the pairing feed: what
 * the network hears from Green Power devices and the pairing steps, shown as a log. The devices that
 * pair while the page is open are listed with what the plugin keeps for them (/zgp-device-raw/<ieee>).
 */
@Component({
  selector: 'app-admin-green-power',
  templateUrl: './admin-green-power.component.html',
  styleUrls: ['../admin-provisioning/admin-provisioning.component.scss', './admin-green-power.component.scss'],
  standalone: false
})
export class AdminGreenPowerComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  @ViewChild('terminal') terminal: ElementRef<HTMLElement>;

  models: ZgpModel[] = [];
  // Picked device type, null: automatic
  model: string | null = null;
  feed: ZgpPairing | null = null;
  // Oldest first, as a terminal
  log: ZgpPairingEvent[] = [];
  joined: JoinedGpd[] = [];

  private since = 0;
  private ticks = 0;
  // Seq when the page opened: older events are history, not devices joined now
  private firstSeq: number | null = null;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.apiService.getZgpModels().subscribe(models => {
      this.models = models ?? [];
      this.model = this.models[0]?.Name ?? null;
    });
    this.subs.sink = timer(0, POLL_PERIOD)
      .pipe(
        filter(() => this.open || this.ticks++ % IDLE_TICKS === 0),
        concatMap(() => this.apiService.getZgpPairing(this.since))
      )
      .subscribe(answer => {
        if (answer) {
          this.receive(answer);
        }
      });
  }

  get open(): boolean {
    return this.feed?.Window?.State === 'opened';
  }

  get left(): string {
    return pairingLeft(this.feed?.Window?.Remaining ?? 0);
  }

  get progress(): number {
    return Math.min(100, Math.round(((this.feed?.Window?.Remaining ?? 0) * 100) / GP_WINDOW));
  }

  // The type the open window pairs as
  get pairingAs(): string {
    const name = this.feed?.Model;
    const model = this.models.find(item => item.Name === name);
    return model ? this.typeLabel(model) : this.translate.instant('admin.gp.type.auto');
  }

  openPairing() {
    this.apiService.putZgpPairing(GP_WINDOW, this.model).subscribe(() => {
      this.toastr.success(this.translate.instant('admin.gp.opened.notify'));
      this.refresh();
    });
  }

  stop() {
    this.apiService.putZgpPairing(0, null).subscribe(() => {
      this.toastr.success(this.translate.instant('admin.gp.closed.notify'));
      this.refresh();
    });
  }

  // A type of the plugin without a translation shows its Description
  typeLabel(model: ZgpModel): string {
    const key = 'admin.gp.type.' + model.Name;
    const label = this.translate.instant(key);
    return label === key ? model.Description : label;
  }

  typeHint(model: ZgpModel): string {
    const key = 'admin.gp.type.' + model.Name + '.hint';
    const hint = this.translate.instant(key);
    return hint === key ? model.Widgets.join(', ') : hint;
  }

  eventText(event: ZgpPairingEvent): string {
    switch (event.Event) {
      case 'heard':
        return event.Encrypted ? 'admin.provisioning.gp.event.heard.encrypted' : 'admin.provisioning.gp.event.heard';
      case 'window':
        return 'admin.provisioning.gp.event.window.' + event.State;
      case 'commissioned':
        return 'admin.provisioning.gp.event.commissioned' + (event.Again ? '.again' : '');
      default:
        return 'admin.provisioning.gp.event.' + event.Event;
    }
  }

  // GP Device ID, as the plugin logs it (0x02: On/Off switch)
  deviceType(record: any): string {
    const id = record?.device_id;
    return typeof id === 'number' ? '0x' + id.toString(16).padStart(2, '0') : '—';
  }

  statusHint(item: JoinedGpd): string | null {
    return item.status === 'removed' || item.status === 'inDB' ? null : 'admin.provisioning.hint.gp.' + item.status;
  }

  private refresh() {
    this.apiService.getZgpPairing(this.since).subscribe(answer => answer && this.receive(answer));
  }

  private receive(answer: ZgpPairing) {
    // A restarted plugin counts from 0 again: start over
    if (answer.Seq < this.since) {
      this.since = 0;
      this.firstSeq = 0;
      return;
    }
    if (this.firstSeq === null) {
      this.firstSeq = answer.Seq;
    }
    this.feed = answer;
    if (!answer.Events.length) {
      return;
    }
    this.log = [...this.log, ...answer.Events].slice(-LOG_LINES);
    this.since = answer.Seq;
    answer.Events.filter(event => event.Seq > this.firstSeq).forEach(event => this.track(event));
    // Keep the newest line in sight, as a terminal does
    setTimeout(() => {
      const element = this.terminal?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  private track(event: ZgpPairingEvent) {
    const status = STATUS_OF_EVENT[event.Event];
    if (!status || !event.IEEE) {
      return;
    }
    let item = this.joined.find(device => device.ieee === event.IEEE);
    if (!item) {
      item = { ieee: event.IEEE, srcId: event.SrcId, status };
      this.joined.unshift(item);
    }
    item.status = status;
    if (status === 'inDB' || status === 'Unexpected') {
      this.apiService
        .getRawZgpDevice(event.IEEE)
        .subscribe(record => (item.record = record?.IEEE ? record : undefined));
    }
  }
}
