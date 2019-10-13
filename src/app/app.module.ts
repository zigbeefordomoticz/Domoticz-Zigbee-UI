import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CoreModule } from '@app/core';
import { SharedModule } from '@app/shared';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { NgBootstrapFormValidationModule } from 'ng-bootstrap-form-validation';
import { PushNotificationsModule } from 'ng-push';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardModule } from './dashboard/dashboard.module';
import { DeviceByNameComponent } from './dashboard/device-by-name/device-by-name.component';
import { ShellModule } from './shell/shell.module';

@NgModule({
  imports: [
    BrowserModule,
    //    ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
    HttpClientModule,
    TranslateModule.forRoot(),
    NgBootstrapFormValidationModule.forRoot(),
    NgbModule,
    CoreModule,
    SharedModule,
    ShellModule,
    DashboardModule,
    PushNotificationsModule,
    AppRoutingModule
  ],
  declarations: [AppComponent],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [DeviceByNameComponent]
})
export class AppModule {}
