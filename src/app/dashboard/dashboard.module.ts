import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from '@app/core';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { PluginStatsComponent } from './plugin-stats/plugin-stats.component';
import { NgxGaugeModule } from 'ngx-gauge';

@NgModule({
  imports: [CommonModule, CoreModule, TranslateModule, ReactiveFormsModule, DashboardRoutingModule, NgxGaugeModule],
  declarations: [DashboardComponent, PluginStatsComponent]
})
export class DashboardModule {}
