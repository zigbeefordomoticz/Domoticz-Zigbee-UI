import { CommonModule } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiPrefixInterceptor } from './http/api-prefix.interceptor';
import { CacheInterceptor } from './http/cache.interceptor';
import { ErrorHandlerInterceptor } from './http/error-handler.interceptor';
import { HttpCacheService } from './http/http-cache.service';
import { HttpService } from './http/http.service';
import { I18nService } from './i18n.service';
import { RouteReusableStrategy } from './route-reusable-strategy';

@NgModule({
  imports: [CommonModule, TranslateModule, RouterModule],
  providers: [
    I18nService,
    HttpCacheService,
    ApiPrefixInterceptor,
    ErrorHandlerInterceptor,
    CacheInterceptor,
    // provideHttpClient MUST come before the HttpClient override below, and
    // AppModule must not call it at all. It supplies its own HttpClient, so
    // whichever provider is flattened last wins. HttpService is the one that
    // chains ApiPrefixInterceptor; if Angular's plain HttpClient wins instead,
    // every request loses its /rest-z4d/1 prefix, hits the SPA fallback and
    // fails with "Http failure during parsing" on a 200 that is really
    // index.html. This is not hypothetical -- it shipped that way.
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HttpClient,
      useClass: HttpService
    },
    {
      provide: RouteReuseStrategy,
      useClass: RouteReusableStrategy
    }
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    // Import guard
    if (parentModule) {
      throw new Error(`${parentModule} has already been loaded. Import Core module in the AppModule only.`);
    }
  }
}
