import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreModule } from '../core.module';
import { Logger, LogLevel, LogOutput } from '../logger.service';
import { HttpCacheService } from './http-cache.service';
import { HttpService } from './http.service';

// Built through CoreModule, as AppModule imports it: the provider order there is what made every
// request lose its /rest-z4d/1 prefix after the Angular 18 migration (#265).
describe('HttpService, as CoreModule provides it', () => {
  const level = Logger.level;
  let http: HttpClient;
  let backend: HttpTestingController;
  let output: ReturnType<typeof vi.fn<LogOutput>>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CoreModule], providers: [provideHttpClientTesting()] });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    output = vi.fn<LogOutput>();
    Logger.outputs.push(output);
    Logger.level = LogLevel.Error;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    Logger.outputs.splice(Logger.outputs.indexOf(output), 1);
    Logger.level = level;
    vi.restoreAllMocks();
    // A request left open fails this test only: the module is reset even when verify throws
    try {
      backend.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  it('is the HttpClient the application gets', () => {
    expect(http).toBeInstanceOf(HttpService);
  });

  it('sends a route under /rest-z4d/1', () => {
    http.get('/plugin').subscribe();
    backend.expectOne('/rest-z4d/1/plugin').flush({});
  });

  it('disableApiPrefix sends the URL as it is, and only for that call', () => {
    http.disableApiPrefix().get('/download/PluginZigbee_01.log').subscribe();
    backend.expectOne('/download/PluginZigbee_01.log').flush('');
    http.get('/plugin').subscribe();
    backend.expectOne('/rest-z4d/1/plugin').flush({});
  });

  it('logs a failed request and passes the error on', () => {
    let status: number | undefined;
    http.get('/plugin').subscribe({ error: e => (status = e.status) });
    backend.expectOne('/rest-z4d/1/plugin').flush(null, { status: 500, statusText: 'Internal Server Error' });
    expect(status).toBe(500);
    expect(output).toHaveBeenCalledWith('ErrorHandlerInterceptor', LogLevel.Error, 'Request error', expect.anything());
  });

  it('skipErrorHandler passes the error on without logging it', () => {
    let status: number | undefined;
    http
      .skipErrorHandler()
      .get('/plugin')
      .subscribe({ error: e => (status = e.status) });
    backend.expectOne('/rest-z4d/1/plugin').flush(null, { status: 404, statusText: 'Not Found' });
    expect(status).toBe(404);
    expect(output).not.toHaveBeenCalled();
  });

  it('cache answers a repeated GET without a request, keyed by the prefixed URL', () => {
    const bodies: unknown[] = [];
    http
      .cache()
      .get('/plugin')
      .subscribe(body => bodies.push(body));
    backend.expectOne('/rest-z4d/1/plugin').flush({ PluginVersion: '9.1.010' });
    http
      .cache()
      .get('/plugin')
      .subscribe(body => bodies.push(body));
    backend.expectNone('/rest-z4d/1/plugin');
    expect(bodies).toEqual([{ PluginVersion: '9.1.010' }, { PluginVersion: '9.1.010' }]);
    expect(TestBed.inject(HttpCacheService).getCacheData('/rest-z4d/1/plugin')).not.toBeNull();
  });

  it('cache(true) asks again', () => {
    http.cache().get('/plugin').subscribe();
    backend.expectOne('/rest-z4d/1/plugin').flush({ n: 1 });
    let body: unknown;
    http
      .cache(true)
      .get('/plugin')
      .subscribe(b => (body = b));
    backend.expectOne('/rest-z4d/1/plugin').flush({ n: 2 });
    expect(body).toEqual({ n: 2 });
  });
});
