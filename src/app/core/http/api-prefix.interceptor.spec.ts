import { HttpHandler, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ApiPrefixInterceptor } from './api-prefix.interceptor';

function sent(request: HttpRequest<unknown>): HttpRequest<unknown> {
  let forwarded: HttpRequest<unknown> | undefined;
  const next: HttpHandler = {
    handle: req => {
      forwarded = req;
      return of(new HttpResponse());
    }
  };
  new ApiPrefixInterceptor().intercept(request, next).subscribe();
  return forwarded!;
}

describe('ApiPrefixInterceptor', () => {
  it('prefixes a route with environment.api_url', () => {
    expect(sent(new HttpRequest('GET', '/plugin')).url).toBe('/rest-z4d/1/plugin');
  });

  it('keeps the verb, the body and the query', () => {
    const params = new HttpParams().set('since', '0');
    const request = sent(new HttpRequest('PUT', '/setting', [{ Name: 'x' }], { params }));
    expect(request.method).toBe('PUT');
    expect(request.body).toEqual([{ Name: 'x' }]);
    expect(request.urlWithParams).toBe('/rest-z4d/1/setting?since=0');
  });

  it.each(['http://domoticz.local:8080/json.htm', 'https://example.org/x', 'HTTP://UPPER.CASE/x'])(
    'leaves an absolute URL alone: %s',
    url => {
      expect(sent(new HttpRequest('GET', url)).url).toBe(url);
    }
  );
});
