import { OnDestroy } from '@angular/core';
import { SubSink } from 'subsink';

export class UnsubscribeOnDestroyAdapter implements OnDestroy {
  subs = new SubSink();

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
