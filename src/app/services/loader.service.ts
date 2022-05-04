import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private _loader = new BehaviorSubject<boolean>(false);
  public readonly loader$ = this._loader.asObservable();

  constructor() {}

  show() {
    this._loader.next(true);
  }

  hide() {
    this._loader.next(false);
  }
}
