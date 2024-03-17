import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '@app/shared';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as exporting from 'highcharts/modules/exporting.src';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { PluginStatsComponent } from './plugin-stats/plugin-stats.component';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    NgxChartsModule,
    DashboardRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ChartModule,
    SharedModule
  ],
  declarations: [DashboardComponent, PluginStatsComponent],
  providers: [{ provide: HIGHCHARTS_MODULES, useFactory: () => [more, exporting] }]
})
export class DashboardModule {}
