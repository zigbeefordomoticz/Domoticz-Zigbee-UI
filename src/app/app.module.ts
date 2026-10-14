import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '@app/core';
import { SharedModule } from '@app/shared';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import Lara from '@primeuix/themes/lara';
import { ToastrModule } from 'ngx-toastr';
import { providePrimeNG } from 'primeng/config';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { ShellModule } from './shell/shell.module';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ClipboardModule,
    TranslateModule.forRoot(),
    NgbModule,
    CoreModule,
    SharedModule,
    ShellModule,
    DashboardModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true
    }),
    AppRoutingModule
  ],
  providers: [
    // Deliberately no provideHttpClient() here. CoreModule provides it, ahead
    // of its HttpClient -> HttpService override; calling it again in this
    // module would be flattened afterwards and silently win, dropping the API
    // prefix interceptor. See the comment in core.module.ts.
    // PrimeNG 19 removed the prebuilt CSS themes under primeng/resources that
    // main.scss used to import, in favour of styled mode generated from a
    // preset. Lara is the same family as the previous lara-light-blue theme.
    // The preset package was @primeng/themes for PrimeNG 19 and is
    // @primeuix/themes from PrimeNG 20 on; 1.2.x matches primeng 20.4.
    // cssLayer keeps the `@layer bootstrap, primeng` ordering main.scss
    // declares, so Bootstrap cannot override PrimeNG.
    providePrimeNG({
      // ripple was set at runtime through PrimeNGConfig, which PrimeNG 19
      // removed; it is configuration now.
      ripple: true,
      theme: {
        preset: Lara,
        options: {
          // PrimeNG styled mode defaults darkModeSelector to 'system', which
          // emits every dark token under @media (prefers-color-scheme: dark)
          // plus `color-scheme: dark` on :root. The rest of the application is
          // Bootstrap light only, so any user whose OS is in dark mode got the
          // PrimeNG tables, inputs and surfaces rendered dark on an otherwise
          // light page. The prebuilt lara-light-blue CSS used before PrimeNG 19
          // had no dark variant, so this only appeared with the upgrade.
          // 'none' turns the dark colour scheme off entirely.
          darkModeSelector: 'none',
          cssLayer: { name: 'primeng', order: 'bootstrap, primeng' }
        }
      }
    })
  ]
})
export class AppModule {}
