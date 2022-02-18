import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '@app/core';
import { SharedModule } from '@app/shared';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMousetrapModule } from 'ngx-mousetrap';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { DeviceByNameComponent } from './dashboard/device-by-name/device-by-name.component';
import { ShellModule } from './shell/shell.module';
import { MatomoConsentMode, NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { NgxMatomoRouterModule } from '@ngx-matomo/router';
import { NgcCookieConsentConfig, NgcCookieConsentModule } from 'ngx-cookieconsent';
import { environment } from '@env/environment';

const cookieConfig: NgcCookieConsentConfig = {
  cookie: {
    name: 'z4d',
    domain: '',
    expiryDays: 10000,
    secure: true
  },
  position: 'bottom',
  theme: 'classic',
  palette: {
    popup: {
      background: '#000000',
      text: '#ffffff',
      link: '#ffffff'
    },
    button: {
      background: '#f1d600',
      text: '#000000',
      border: 'transparent'
    }
  },
  type: 'opt-out'
};

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    //    ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
    HttpClientModule,
    TranslateModule.forRoot(),
    NgxMousetrapModule.forRoot(),
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
    NgxMatomoTrackerModule.forRoot({
      acceptDoNotTrack: false,
      requireConsent: MatomoConsentMode.TRACKING,
      //disabled: !environment.production,
      trackerUrl: environment.trackerUrl,
      siteId: environment.siteId
    }),
    NgxMatomoRouterModule,
    NgcCookieConsentModule.forRoot(cookieConfig),
    AppRoutingModule
  ],
  declarations: [AppComponent],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [DeviceByNameComponent]
})
export class AppModule {}
