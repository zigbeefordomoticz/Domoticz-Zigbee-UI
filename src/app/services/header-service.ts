import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  public restart = new BehaviorSubject(false);
  public showManufacturerCasaia = new BehaviorSubject(false);
  public showManufacturerZlinky = new BehaviorSubject(false);
  public logError = new BehaviorSubject(false);
  public polling = new BehaviorSubject(false);

  constructor() {}

  setRestart(restart: any) {
    this.restart.next(restart);
  }

  setShowManufacturerCasaia(show: any) {
    this.showManufacturerCasaia.next(show);
  }

  setShowManufacturerZlinky(show: any) {
    this.showManufacturerZlinky.next(show);
  }

  setError(logError: any) {
    this.logError.next(logError);
  }

  setPolling(poll: boolean) {
    this.polling.next(poll);
  }
}
