import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VersionService {
  public reload = new BehaviorSubject(false);

  constructor() {}

  setReload(reload: any) {
    this.reload.next(reload);
  }
}
