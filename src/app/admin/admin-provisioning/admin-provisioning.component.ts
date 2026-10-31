import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { ZDevices } from '@app/shared/models/device';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { NewDevice, NewHardware } from '@app/shared/models/new-hardware';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription, timer } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import {
  pairingLeft,
  PairingStateService,
  PERMIT_TO_JOIN_DURATION,
  PERMIT_TO_JOIN_PERMANENT
} from '../pairing-state.service';

const POLL_PERIOD = 5000;

type JoinStatus = 'joining' | 'inDB' | 'Failed' | 'Unexpected';

interface JoinedDevice {
  nwkId: string;
  status: JoinStatus;
  hardware?: NewHardware;
}

/**
 * Admin → Provisioning: open pairing (whole network or one router), list what joins, and act on a
 * device already paired.
 *
 * The plugin queues every device that announces itself; /rcv-nw-hrdwr answers the ones still in
 * discovery (NwkId only) and, once, the ones done (with ProvisionStatus). This page keeps the done
 * ones until it is left. /new-hrdwr/enable empties that queue and opens pairing for 4 minutes.
 * Leaving the page does not close pairing.
 */
@Component({
  selector: 'app-admin-provisioning',
  templateUrl: './admin-provisioning.component.html',
  styleUrls: ['./admin-provisioning.component.scss'],
  standalone: false
})
export class AdminProvisioningComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  mode: 'all' | 'router' = 'all';
  routers: ZDevices[] = [];
  router: string = null;
  seconds: number | null = null;
  joined: JoinedDevice[] = [];
  devices: DeviceByName[] = [];
  device: string = null;

  private polling: Subscription;

  constructor(
    private apiService: ApiService,
    private pairingState: PairingStateService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.pairingState.seconds$.subscribe(seconds => (this.seconds = seconds));
    this.pairingState.refresh().subscribe(seconds => {
      if (seconds > 0) {
        this.startPolling();
      }
    });
    this.apiService.getZDevices(true).subscribe(devices => {
      this.routers = devices.filter(device => device.LogicalType === 'Router' || device.LogicalType === 'Coordinator');
    });
    this.loadDevices();
  }

  override ngOnDestroy() {
    this.polling?.unsubscribe();
    super.ngOnDestroy();
  }

  get open(): boolean {
    return this.seconds > 0;
  }

  get permanent(): boolean {
    return this.seconds === PERMIT_TO_JOIN_PERMANENT;
  }

  get left(): string {
    return pairingLeft(this.seconds);
  }

  // Share of the 4 minutes still to go, for the progress bar
  get progress(): number {
    return Math.min(100, Math.round(((this.seconds ?? 0) * 100) / PERMIT_TO_JOIN_DURATION));
  }

  get canOpen(): boolean {
    return this.mode === 'all' || !!this.router;
  }

  openPairing() {
    if (this.mode === 'all') {
      // Empties the plugin's queue and opens pairing everywhere for 4 minutes
      this.apiService.getNewHardware(true).subscribe(() => {
        this.joined = [];
        this.opened();
      });
    } else {
      this.extend();
    }
  }

  extend() {
    this.apiService.putPermitToJoin(this.permitToJoin(PERMIT_TO_JOIN_DURATION)).subscribe(() => this.opened());
  }

  stop() {
    this.apiService.putPermitToJoin(this.permitToJoin(0)).subscribe(() => {
      this.toastr.success(this.translate.instant('admin.permittojoin.stop.notify'));
      this.pairingState.refresh().subscribe();
    });
  }

  fullReset() {
    this.apiService
      .putPairingFullReset(this.device)
      .subscribe(() => this.toastr.success(this.translate.instant('admin.fullreset.notify')));
  }

  recreateWidgets() {
    this.apiService
      .putRecreateWidgets(this.device)
      .subscribe(() => this.toastr.success(this.translate.instant('admin.recreate.notify')));
  }

  // Found by name, NwkId or model
  searchDevice(term: string, device: DeviceByName): boolean {
    const text = term.toLowerCase();
    return [device.ZDeviceName, device._NwkId, device.Model].some(value => value?.toLowerCase().includes(text));
  }

  deviceOf(nwkId: string): DeviceByName | undefined {
    return this.devices.find(device => device._NwkId === nwkId);
  }

  certified(value: string): string {
    return value === 'yes' ? 'yes' : value === 'no' ? 'no' : 'unknown';
  }

  private permitToJoin(seconds: number): any {
    const body: any = { PermitToJoin: seconds };
    if (this.mode === 'router' && this.router) {
      body.Router = this.router;
    }
    return body;
  }

  private opened() {
    this.toastr.success(this.translate.instant('admin.permittojoin.4min.notify'));
    this.pairingState.set(PERMIT_TO_JOIN_DURATION);
    this.startPolling();
  }

  private startPolling() {
    if (this.polling) {
      return;
    }
    this.polling = timer(0, POLL_PERIOD)
      .pipe(concatMap(() => this.apiService.getReceiveNewHardware()))
      .subscribe(answer => {
        this.receive(answer);
        this.pairingState.refresh().subscribe(() => {
          // Keep listening while pairing is open or a device is still in discovery
          if (!this.open && !this.joined.some(device => device.status === 'joining')) {
            this.polling?.unsubscribe();
            this.polling = null;
          }
        });
      });
  }

  private receive(answer: NewDevice) {
    let done = false;
    for (const hardware of answer?.NewDevices ?? []) {
      const status = (hardware.ProvisionStatus as JoinStatus) || 'joining';
      const known = this.joined.find(device => device.nwkId === hardware.NwkId);
      if (known) {
        known.status = status;
        known.hardware = hardware.ProvisionStatus ? hardware : known.hardware;
      } else {
        this.joined.unshift({
          nwkId: hardware.NwkId,
          status,
          hardware: hardware.ProvisionStatus ? hardware : undefined
        });
      }
      done = done || !!hardware.ProvisionStatus;
    }
    if (done) {
      // Names and widgets of the devices just created
      this.loadDevices();
    }
  }

  private loadDevices() {
    this.apiService.getZDeviceName().subscribe(devices => (this.devices = devices ?? []));
  }
}
