import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  public restart = new BehaviorSubject(false);
  public logError = new BehaviorSubject(false);

  constructor() {}

  setRestart(restart: any) {
    this.restart.next(restart);
  }

  setError(logError: any) {
    this.logError.next(logError);
  }
}
