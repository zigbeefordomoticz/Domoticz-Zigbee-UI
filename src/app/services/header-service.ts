import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  public restart = new BehaviorSubject(false);
  public showManufacturer = new BehaviorSubject(false);
  public logError = new BehaviorSubject(false);
  public polling = new BehaviorSubject(false);

  constructor() {}

  setRestart(restart: any) {
    this.restart.next(restart);
  }

  setShowManufacturer(show: any) {
    this.showManufacturer.next(show);
  }

  setError(logError: any) {
    this.logError.next(logError);
  }

  setPolling(poll: boolean) {
    this.polling.next(poll);
  }
}
