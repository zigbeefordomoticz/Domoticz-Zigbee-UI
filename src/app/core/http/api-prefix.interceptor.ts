import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Prefixes all requests not starting with `http[s]` with `environment.serverUrl`.
 */
@Injectable()
export class ApiPrefixInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!/^(http|https):/i.test(request.url)) {
      const baseUrl = window.location.pathname.includes('zigate') ? '/zigate' : '';
      let url = null;
      url = baseUrl + environment.api_url + request.url;

      request = request.clone({
        url: url
      });
    }
    return next.handle(request);
  }
}
