import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxGaugeModule } from 'ngx-gauge';
import { ToppyModule } from 'toppy';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';
import { PluginStatsComponent } from './plugin-stats/plugin-stats.component';

@NgModule({
  imports: [
    DashboardRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    NgxGaugeModule,
    ToppyModule,
    TranslateModule,
    NgxDatatableModule
  ],
  declarations: [DashboardComponent, PluginStatsComponent, DeviceByNameComponent]
})
export class DashboardModule {}
