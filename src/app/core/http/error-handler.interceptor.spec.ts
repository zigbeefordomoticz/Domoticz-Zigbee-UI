import { HttpErrorResponse, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger, LogLevel, LogOutput } from '../logger.service';
import { ErrorHandlerInterceptor } from './error-handler.interceptor';

const request = new HttpRequest('GET', '/rest-z4d/1/plugin');

describe('ErrorHandlerInterceptor', () => {
  const level = Logger.level;
  let output: ReturnType<typeof vi.fn<LogOutput>>;

  beforeEach(() => {
    output = vi.fn<LogOutput>();
    Logger.outputs.push(output);
    Logger.level = LogLevel.Error;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    Logger.outputs.splice(Logger.outputs.indexOf(output), 1);
    Logger.level = level;
    vi.restoreAllMocks();
  });

  it('passes a response on untouched', () => {
    const response = new HttpResponse({ body: { ok: true } });
    const next: HttpHandler = { handle: () => of(response) };
    let got: unknown;
    new ErrorHandlerInterceptor().intercept(request, next).subscribe(event => (got = event));
    expect(got).toBe(response);
    expect(output).not.toHaveBeenCalled();
  });

  it('logs an error outside production and rethrows the same object', () => {
    const failure = new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: request.url });
    const next: HttpHandler = { handle: () => throwError(() => failure) };
    let caught: unknown;
    new ErrorHandlerInterceptor().intercept(request, next).subscribe({ error: e => (caught = e) });
    expect(caught).toBe(failure);
    expect(output).toHaveBeenCalledWith('ErrorHandlerInterceptor', LogLevel.Error, 'Request error', failure);
  });
});
