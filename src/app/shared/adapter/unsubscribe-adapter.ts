import { OnDestroy, Directive } from '@angular/core';
import { SubSink } from 'subsink';

@Directive()
export abstract class UnsubscribeOnDestroyAdapter implements OnDestroy {
  subs = new SubSink();

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
