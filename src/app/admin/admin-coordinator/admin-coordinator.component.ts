import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { Plugin } from '@app/shared/models/plugin';
import { coordinatorChannel } from '@app/shared/utils/plugin-identity';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

// /change-channel accepts 11 to 26 only
const CHANNELS = Array.from({ length: 16 }, (_, i) => 11 + i);

interface ChannelBar {
  channel: number;
  level: number | null;
  height: number;
}

/**
 * Admin → Coordinator: what the coordinator is, a channel change helped by the last energy scan,
 * and the soft reset.
 *
 * Energy: /nwk-stat lists the report timestamps; /nwk-stat/<ts> answers, per router, the energy
 * measured on each channel (0-255, higher is noisier). Bars show the average over the routers.
 * Soft reset: /sw-reset-coordinator only acts on a ZiGate; it is not offered on zigpy radios.
 * /coordinator also carries the network key: it is never shown.
 */
@Component({
  selector: 'app-admin-coordinator',
  templateUrl: './admin-coordinator.component.html',
  styleUrls: ['./admin-coordinator.component.scss'],
  standalone: false
})
export class AdminCoordinatorComponent implements OnInit {
  plugin: Plugin;
  coordinator: any;
  channel: number | null = null;
  selected: number | null = null;
  bars: ChannelBar[] = CHANNELS.map((channel): ChannelBar => ({ channel, level: null, height: 0 }));
  scanTime: number | null = null;
  scanRouters = 0;

  constructor(
    private apiService: ApiService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getPlugin().subscribe(plugin => (this.plugin = plugin));
    this.apiService.getCoordinator().subscribe(coordinator => {
      this.coordinator = coordinator;
      this.channel = coordinatorChannel(coordinator);
    });
    this.apiService
      .getNwkStats()
      .pipe(
        switchMap(timestamps => {
          const last = (timestamps ?? [])
            .map(Number)
            .filter(ts => !isNaN(ts))
            .sort((a, b) => b - a)[0];
          if (last === undefined) {
            return of(null);
          }
          this.scanTime = last;
          return this.apiService.getNwkStatsByTimeStamp(String(last));
        }),
        catchError(() => of(null))
      )
      .subscribe(routers => this.applyEnergy(routers));
  }

  get hasEnergy(): boolean {
    return this.bars.some(bar => bar.level !== null);
  }

  // Soft reset is a ZiGate command; zigpy radios ignore it
  get canSoftReset(): boolean {
    return this.plugin !== undefined && !this.plugin.Zigpy;
  }

  select(channel: number) {
    this.selected = channel === this.channel ? null : channel;
  }

  confirmChannel(content: any) {
    // Dismissed (Cancel, ✕, Escape): nothing to do
    this.modalService.open(content, { ariaLabelledBy: 'channel-title' }).result.then(
      () => this.changeChannel(),
      (): void => undefined
    );
  }

  softReset() {
    this.apiService
      .getSwReset()
      .subscribe(() => this.toastr.success(this.translate.instant('admin.coordinator.swreset.notify')));
  }

  levelLabel(bar: ChannelBar): string {
    return bar.level === null
      ? String(bar.channel)
      : this.translate.instant('admin.coord.channel.level', { channel: bar.channel, level: bar.level });
  }

  private changeChannel() {
    const channel = this.selected;
    this.apiService.putChangeChannel(channel).subscribe(() => {
      this.toastr.success(this.translate.instant('admin.coordinator.switchchannel.notify'));
      this.selected = null;
    });
  }

  private applyEnergy(routers: any) {
    const list: any[] = Array.isArray(routers) ? routers.filter(router => Array.isArray(router?.Channels)) : [];
    this.scanRouters = list.length;
    if (!list.length) {
      return;
    }
    const averages = CHANNELS.map(channel => {
      const levels = list
        .map(router => router.Channels.find((entry: any) => Number(entry.Channel) === channel)?.Level)
        .filter(level => level !== undefined && level !== null)
        .map(Number);
      return levels.length ? Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length) : null;
    });
    // Scaled to the noisiest channel so that quiet ones stay visible
    const max = Math.max(1, ...averages.filter(level => level !== null));
    this.bars = CHANNELS.map(
      (channel, i): ChannelBar => ({
        channel,
        level: averages[i],
        height: averages[i] === null ? 0 : Math.max(4, Math.round((averages[i] * 100) / max))
      })
    );
  }
}
