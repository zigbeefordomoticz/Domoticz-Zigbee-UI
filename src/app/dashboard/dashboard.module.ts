import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from '@app/shared';
import { TranslateModule } from '@ngx-translate/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { HighchartsChartModule } from 'highcharts-angular';
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
    HighchartsChartModule,
    SharedModule
  ],
  declarations: [DashboardComponent, PluginStatsComponent]
})
export class DashboardModule {}
