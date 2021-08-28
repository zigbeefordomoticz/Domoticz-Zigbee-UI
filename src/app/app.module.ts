import { APP_BASE_HREF } from '@angular/common';
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
    AppRoutingModule
  ],
  declarations: [AppComponent],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [DeviceByNameComponent]
})
export class AppModule {}
