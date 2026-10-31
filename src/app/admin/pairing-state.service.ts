import { Injectable } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { BehaviorSubject, interval, Observable, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// /permit-to-join answers the seconds left, 0 when closed and 255 for no time limit
export const PERMIT_TO_JOIN_PERMANENT = 255;
export const PERMIT_TO_JOIN_DURATION = 240;

/**
 * Pairing state shared by the Admin status bar and the Provisioning tab, so both show the same
 * countdown. Counts down locally between two reads of /permit-to-join.
 */
@Injectable({ providedIn: 'root' })
export class PairingStateService {
  readonly seconds$ = new BehaviorSubject<number | null>(null);
  private ticker: Subscription;

  constructor(private apiService: ApiService) {}

  refresh(): Observable<number> {
    return this.apiService.getPermitToJoin().pipe(
      map(result => result?.PermitToJoin ?? 0),
      tap(seconds => this.set(seconds))
    );
  }

  set(seconds: number) {
    this.seconds$.next(seconds);
    if (this.counting(seconds) && !this.ticker) {
      this.ticker = interval(1000).subscribe(() => {
        const left = this.seconds$.value;
        if (this.counting(left)) {
          this.seconds$.next(left - 1);
        } else {
          this.ticker.unsubscribe();
          this.ticker = null;
        }
      });
    }
  }

  private counting(seconds: number): boolean {
    return seconds > 0 && seconds !== PERMIT_TO_JOIN_PERMANENT;
  }
}

export function pairingLeft(seconds: number): string {
  const s = Math.max(0, seconds ?? 0);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
