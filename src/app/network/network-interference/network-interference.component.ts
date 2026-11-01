import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { NwkStat } from '@app/shared/models/nwk';
import { coordinatorChannel } from '@app/shared/utils/plugin-identity';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, interval, Observable, of, Subscription } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';

/** Zigbee 2.4 GHz channels, in the order of the columns. */
export const CHANNELS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];

/** One energy level per channel (index 0 is channel 11), or null when nothing was measured. */
type Levels = Array<number | null>;

interface RouterRow {
  nwkId: string;
  name: string;
  tx: number | null;
  fail: number | null;
  // null: the router did not answer the scan (the plugin then stores 0 on every channel)
  levels: Levels | null;
}

interface ScanRow {
  timestamp: string;
  // In milliseconds, for the date pipe
  time: number;
  routers: RouterRow[];
  answered: number;
  // Average of the routers that answered; null when none did
  levels: Levels | null;
}

// How long to wait for the report of a scan just started: a zigpy scan takes seconds, a ZiGate one a few minutes
const POLL_EVERY_MS = 5000;
const POLL_COUNT = 36;

/**
 * Network › Interference: the energy measured on each Zigbee channel, scan after scan.
 *
 * `/nwk-stat` lists the stored reports by timestamp; `/nwk-stat/<timestamp>` gives the routers that measured, each
 * with one level (0–255) per channel. A zigpy coordinator measures alone; with a ZiGate every router does, and the
 * report adds what each one sent (Tx) and failed to send (Failure).
 */
@Component({
  selector: 'app-network-interference',
  templateUrl: './network-interference.component.html',
  styleUrls: ['./network-interference.component.scss'],
  standalone: false
})
export class NetworkInterferenceComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  // A report was added or deleted: the Network figures read it again
  @Output() reportsChanged = new EventEmitter<void>();

  readonly channels = CHANNELS;

  channel: number | null = null;
  zigate = false;
  scans: ScanRow[] = [];
  average: Levels | null = null;
  quietest: Array<{ channel: number; level: number }> = [];
  loaded = false;
  waiting = false;
  mode: 'scan' | 'router' = 'scan';
  routerScan: string | null = null;

  private poll: Subscription | null = null;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.apiService.getCoordinator().subscribe(coordinator => {
      this.channel = coordinatorChannel(coordinator);
      this.computeQuietest();
    });
    this.apiService.getPlugin().subscribe(plugin => (this.zigate = plugin?.Zigpy === false));
    this.load();
  }

  get selectedRouterScan(): ScanRow | undefined {
    return this.scans.find(scan => scan.timestamp === this.routerScan) ?? this.scans[0];
  }

  load(): void {
    this.subs.sink = this.readScans().subscribe(scans => {
      this.scans = scans;
      this.average = averageOf(scans.map(scan => scan.levels));
      if (!scans.some(scan => scan.timestamp === this.routerScan)) {
        this.routerScan = scans[0]?.timestamp ?? null;
      }
      this.computeQuietest();
      this.loaded = true;
    });
  }

  /** Start a scan, then look for its report until it appears. */
  scan(full = false): void {
    const known = new Set(this.scans.map(scan => scan.timestamp));
    const request = full ? this.apiService.getNwkFull() : this.apiService.getReqInter();
    request.subscribe(() => {
      this.toastr.success(this.translate.instant('network.interference.launched'));
      this.waiting = true;
      this.poll?.unsubscribe();
      this.poll = interval(POLL_EVERY_MS)
        .pipe(
          take(POLL_COUNT),
          switchMap(() => this.apiService.getNwkStats().pipe(catchError(() => of([]))))
        )
        .subscribe({
          next: timestamps => {
            if ((timestamps || []).some(timestamp => !known.has(String(timestamp)))) {
              this.stopWaiting();
              this.load();
              this.reportsChanged.emit();
            }
          },
          complete: () => (this.waiting = false)
        });
      this.subs.sink = this.poll;
    });
  }

  delete(timestamp: string): void {
    this.apiService.deleteNwkStatsByTimeStamp(timestamp).subscribe(() => {
      this.load();
      this.reportsChanged.emit();
    });
  }

  level(levels: Levels | null, index: number): number | null {
    return levels ? levels[index] : null;
  }

  /** Colour band of a level, from quiet (a) to saturated (e). */
  band(level: number | null): string {
    if (level === null || level === undefined) {
      return 'band-none';
    }
    if (level <= 40) {
      return 'band-a';
    }
    if (level <= 80) {
      return 'band-b';
    }
    if (level <= 120) {
      return 'band-c';
    }
    return level <= 160 ? 'band-d' : 'band-e';
  }

  private stopWaiting(): void {
    this.poll?.unsubscribe();
    this.poll = null;
    this.waiting = false;
  }

  private readScans(): Observable<ScanRow[]> {
    return this.apiService.getNwkStats().pipe(
      switchMap(timestamps => {
        const newestFirst = (timestamps || []).map(String).sort((a, b) => Number(b) - Number(a));
        if (!newestFirst.length) {
          return of([]);
        }
        // One report that cannot be read leaves an empty row, not an empty page
        return forkJoin(
          newestFirst.map(timestamp =>
            this.apiService.getNwkStatsByTimeStamp(timestamp).pipe(
              catchError(() => of([])),
              switchMap((stats: NwkStat[]) => of(toScanRow(timestamp, stats)))
            )
          )
        );
      }),
      catchError(() => of([]))
    );
  }

  // The network's own channel is left out: its traffic is counted, so it is always among the noisiest
  private computeQuietest(): void {
    const levels = this.average;
    this.quietest = levels
      ? CHANNELS.map((channel, index) => ({ channel, level: levels[index] }))
          .filter(entry => entry.level !== null && entry.channel !== this.channel)
          .sort((a, b) => a.level - b.level)
          .slice(0, 3)
      : [];
  }
}

function toScanRow(timestamp: string, stats: NwkStat[]): ScanRow {
  const routers: RouterRow[] = (Array.isArray(stats) ? stats : []).map(stat => ({
    nwkId: stat._NwkId,
    name: stat.ZDeviceName || stat._NwkId,
    tx: stat.Tx ?? null,
    fail: stat.Failure ?? null,
    levels: levelsOf(stat)
  }));
  const answered = routers.filter(router => router.levels);
  return {
    timestamp,
    time: Number(timestamp) * 1000,
    routers,
    answered: answered.length,
    levels: averageOf(answered.map(router => router.levels))
  };
}

function levelsOf(stat: NwkStat): Levels | null {
  const levels: Levels = CHANNELS.map((): number | null => null);
  (stat.Channels || []).forEach(entry => {
    const index = CHANNELS.indexOf(Number(entry.Channel));
    if (index >= 0 && typeof entry.Level === 'number') {
      levels[index] = entry.Level;
    }
  });
  // The plugin writes 0 on every channel for a router that did not answer
  return levels.some(level => level) ? levels : null;
}

function averageOf(rows: Array<Levels | null>): Levels | null {
  const measured = rows.filter(row => row);
  if (!measured.length) {
    return null;
  }
  return CHANNELS.map((_channel, index) => {
    const values = measured.map(row => row[index]).filter(value => value !== null);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  });
}
