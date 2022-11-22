import { ClipboardModule } from '@angular/cdk/clipboard';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '@app/core';
import { SharedModule } from '@app/shared';
import { environment } from '@env/environment';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMatomoRouterModule } from '@ngx-matomo/router';
import { MatomoConsentMode, NgxMatomoTrackerModule } from '@ngx-matomo/tracker';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMousetrapModule } from 'ngx-mousetrap';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { DeviceByNameComponent } from './dashboard/device-by-name/device-by-name.component';
import { ShellModule } from './shell/shell.module';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    //    ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
    HttpClientModule,
    ClipboardModule,
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
    AppRoutingModule
  ],
  declarations: [AppComponent],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [DeviceByNameComponent]
})
export class AppModule {}
