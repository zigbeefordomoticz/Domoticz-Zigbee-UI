import { Injectable } from '@angular/core';
import { Logger } from '@app/core';
import { BehaviorSubject, EMPTY, Observable, Subject, timer } from 'rxjs';
import { catchError, delayWhen, retryWhen, switchAll, tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export const WS_ENDPOINT = 'ws://localhost:8441/logs';
export const RECONNECT_INTERVAL = 10000;

const log = new Logger('WebSocketService');

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$?: WebSocketSubject<any>;
  private messagesSubject$ = new BehaviorSubject<any>(0);
  public messages$ = this.messagesSubject$.pipe(
    switchAll(),
    catchError(e => {
      throw e;
    })
  );

  constructor() {}

  /**
   * Creates a new WebSocket subject and send it to the messages subject
   * @param cfg if true the observable will be retried.
   */
  public connect(cfg: { reconnect: boolean } = { reconnect: false }): void {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();
      const messages = this.socket$.pipe(
        cfg.reconnect ? this.reconnect : o => o,
        tap({
          error: error => log.debug(error)
        }),
        catchError(_ => EMPTY)
      );
      //toDO only next an observable if a new subscription was made double-check this
      this.messagesSubject$.next(messages);
    }
  }

  /**
   * Retry a given observable by a time span
   * @param observable the observable to be retried
   */
  private reconnect(observable: Observable<any>): Observable<any> {
    return observable.pipe(
      retryWhen(errors =>
        errors.pipe(
          tap(val => {
            log.debug('Try to reconnect', val);
          }),
          delayWhen(_ => timer(RECONNECT_INTERVAL))
        )
      )
    );
  }

  multiplex(event: string): Observable<any> {
    return this.socket$.multiplex(
      () => ({ type: 'subscribe', tag: event }),
      () => ({ type: 'unsubscribe', tag: event }),
      message => message.type === event
    );
  }

  close() {
    this.socket$.complete();
    this.socket$ = undefined;
  }

  sendMessage(msg: any) {
    this.socket$.next(msg);
  }

  /**
   * Return a custom WebSocket subject which reconnects after failure
   */
  private getNewWebSocket() {
    return webSocket({
      url: WS_ENDPOINT,
      openObserver: {
        next: event => {
          log.debug('connection ok');
          log.debug(event);
        }
      },
      closeObserver: {
        next: event => {
          log.debug('connection closed');
          log.debug(event);
          this.socket$ = undefined;
          this.connect({ reconnect: true });
        }
      }
    });
  }
}
