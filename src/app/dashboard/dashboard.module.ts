import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '@app/shared';
import { TranslateModule } from '@ngx-translate/core';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import { FileSaverModule } from 'ngx-filesaver';
import * as more from 'highcharts/highcharts-more.src';
import * as exporting from 'highcharts/modules/exporting.src';
import * as offlineExporting from 'highcharts/modules/offline-exporting.src';
import { DashboardSummaryComponent } from './dashboard-summary/dashboard-summary.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { PluginStatsComponent } from './plugin-stats/plugin-stats.component';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    DashboardRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ChartModule,
    FileSaverModule,
    SharedModule
  ],
  declarations: [DashboardComponent, DashboardSummaryComponent, PluginStatsComponent],
  providers: [{ provide: HIGHCHARTS_MODULES, useFactory: () => [more, exporting, offlineExporting] }]
})
export class DashboardModule {}
