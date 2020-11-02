import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HeaderService {
  public restart = new BehaviorSubject(false);
  public log_error = new BehaviorSubject(false);

  constructor() {}

  setRestart(restart: any) {
    this.restart.next(restart);
  }

  setError(log_error: any) {
    this.log_error.next(log_error);
  }
}
