import { HttpEvent, HttpEventType, HttpHandler, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Logger, LogLevel } from '../logger.service';
import { CacheInterceptor } from './cache.interceptor';
import { HttpCacheService } from './http-cache.service';

// A backend that answers { n: <call number> }, so a cached answer is told apart from a fresh one
function backend(answer?: (n: number) => Observable<HttpEvent<unknown>>) {
  const handler = {
    calls: 0,
    handle(): Observable<HttpEvent<unknown>> {
      handler.calls++;
      return answer ? answer(handler.calls) : of(new HttpResponse({ body: { n: handler.calls } }));
    }
  };
  return handler as HttpHandler & { calls: number };
}

function bodies(interceptor: CacheInterceptor, request: HttpRequest<unknown>, next: HttpHandler): unknown[] {
  const seen: unknown[] = [];
  interceptor.intercept(request, next).subscribe(event => {
    if (event instanceof HttpResponse) {
      seen.push(event.body);
    }
  });
  return seen;
}

const get = new HttpRequest('GET', '/rest-z4d/1/plugin');

describe('CacheInterceptor', () => {
  const level = Logger.level;
  beforeAll(() => (Logger.level = LogLevel.Off));
  afterAll(() => (Logger.level = level));

  it('answers a repeated GET from the cache', () => {
    const next = backend();
    const interceptor = new CacheInterceptor(new HttpCacheService());
    expect(bodies(interceptor, get, next)).toEqual([{ n: 1 }]);
    expect(bodies(interceptor, get, next)).toEqual([{ n: 1 }]);
    expect(next.calls).toBe(1);
  });

  it('answers with a new response object, not the cached one', () => {
    const cache = new HttpCacheService();
    const interceptor = new CacheInterceptor(cache);
    bodies(interceptor, get, backend());
    let cached: unknown;
    interceptor.intercept(get, backend()).subscribe(event => (cached = event));
    expect(cached).toBeInstanceOf(HttpResponse);
    expect(cached).not.toBe(cache.getCacheData(get.urlWithParams));
  });

  it('keys the cache by URL and query', () => {
    const next = backend();
    const interceptor = new CacheInterceptor(new HttpCacheService());
    bodies(interceptor, new HttpRequest('GET', '/x', { params: new HttpParams().set('a', '1') }), next);
    bodies(interceptor, new HttpRequest('GET', '/x', { params: new HttpParams().set('a', '2') }), next);
    expect(next.calls).toBe(2);
  });

  it('never caches another verb', () => {
    const next = backend();
    const interceptor = new CacheInterceptor(new HttpCacheService());
    const put = new HttpRequest('PUT', '/rest-z4d/1/setting', []);
    bodies(interceptor, put, next);
    bodies(interceptor, put, next);
    expect(next.calls).toBe(2);
  });

  it('with update, asks again and stores the new answer', () => {
    const next = backend();
    const cache = new HttpCacheService();
    const interceptor = new CacheInterceptor(cache);
    bodies(interceptor, get, next);
    expect(bodies(interceptor.configure({ update: true }), get, next)).toEqual([{ n: 2 }]);
    expect(bodies(interceptor, get, next)).toEqual([{ n: 2 }]);
    expect(next.calls).toBe(2);
  });

  it('configure returns a new instance and leaves the original as it was', () => {
    const interceptor = new CacheInterceptor(new HttpCacheService());
    expect(interceptor.configure({ update: true })).not.toBe(interceptor);
    const next = backend();
    bodies(interceptor, get, next);
    bodies(interceptor, get, next);
    expect(next.calls).toBe(1);
  });

  it('passes an error on and caches nothing', () => {
    const failure = new Error('offline');
    const next = backend(() => throwError(() => failure));
    const interceptor = new CacheInterceptor(new HttpCacheService());
    let caught: unknown;
    interceptor.intercept(get, next).subscribe({ error: e => (caught = e) });
    expect(caught).toBe(failure);
    interceptor.intercept(get, next).subscribe({ error: () => undefined });
    expect(next.calls).toBe(2);
  });

  it('passes events other than the response on, without caching them', () => {
    const cache = new HttpCacheService();
    const next = backend(() => of({ type: HttpEventType.Sent }));
    const events: unknown[] = [];
    new CacheInterceptor(cache).intercept(get, next).subscribe(event => events.push(event));
    expect(events).toEqual([{ type: HttpEventType.Sent }]);
    expect(cache.getCacheData(get.urlWithParams)).toBeNull();
  });
});
