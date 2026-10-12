import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const untilDestroyedSymbol = Symbol('untilDestroyed');

/**
 * RxJS operator that unsubscribe from observables on destory.
 * Code forked from https://github.com/NetanelBasal/ngx-take-until-destroy
 *
 * IMPORTANT: Add the `untilDestroyed` operator as the last one to prevent leaks with intermediate observables in the
 * operator chain.
 *
 * @param instance The parent Angular component or object instance.
 * @param destroyMethodName The method to hook on (default: 'ngOnDestroy').
 * @example
 * ```
 * import { untilDestroyed } from '@app/core';
 *
 * @Component({
 * selector: 'app-example',
 *   templateUrl: './example.component.html'
 * })
 * export class ExampleComponent implements OnInit, OnDestroy {
 *   ngOnInit() {
 *     interval(1000)
 *       .pipe(untilDestroyed(this))
 *       .subscribe(val => console.log(val));
 *   }
 *
 *   // This method must be present, even if empty.
 *   ngOnDestroy() {
 *     // To protect you, an error will be thrown if it doesn't exist.
 *   }
 * }
 * ```
 */
export function untilDestroyed(instance: object, destroyMethodName: string = 'ngOnDestroy') {
  return <T>(source: Observable<T>) => {
    // This operator hooks the instance's destroy method and stashes a Subject on
    // the instance itself, so the access is dynamic by design. TypeScript 5.5
    // rejects indexing `object`, hence the local view onto it.
    const target = instance as Record<string | symbol, any>;
    const originalDestroy = target[destroyMethodName];
    const hasDestroyFunction = typeof originalDestroy === 'function';

    if (!hasDestroyFunction) {
      throw new Error(
        `${instance.constructor.name} is using untilDestroyed but doesn't implement ${destroyMethodName}`
      );
    }

    if (!target[untilDestroyedSymbol]) {
      target[untilDestroyedSymbol] = new Subject();

      target[destroyMethodName] = function () {
        if (hasDestroyFunction) {
          // eslint-disable-next-line prefer-rest-params
          originalDestroy.apply(this, arguments);
        }
        target[untilDestroyedSymbol].next();
        target[untilDestroyedSymbol].complete();
      };
    }

    return source.pipe(takeUntil<T>(target[untilDestroyedSymbol]));
  };
}
