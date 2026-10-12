import { ClipboardModule } from '@angular/cdk/clipboard';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '@app/core';
import { SharedModule } from '@app/shared';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import Lara from '@primeng/themes/lara';
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
    provideHttpClient(withInterceptorsFromDi()),
    // PrimeNG 19 removed the prebuilt CSS themes under primeng/resources that
    // main.scss used to import, in favour of styled mode generated from a
    // preset. Lara is the same family as the previous lara-light-blue theme.
    // cssLayer keeps the `@layer bootstrap, primeng` ordering main.scss
    // declares, so Bootstrap cannot override PrimeNG.
    providePrimeNG({
      // ripple was set at runtime through PrimeNGConfig, which PrimeNG 19
      // removed; it is configuration now.
      ripple: true,
      theme: {
        preset: Lara,
        options: {
          cssLayer: { name: 'primeng', order: 'bootstrap, primeng' }
        }
      }
    })
  ]
})
export class AppModule {}
