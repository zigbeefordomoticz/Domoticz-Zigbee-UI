import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from '@app/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { PluginStatsComponent } from './plugin-stats/plugin-stats.component';
import { PluginComponent } from './plugin/plugin.component';
import { ZigateComponent } from './zigate/zigate.component';

@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    TranslateModule,
    ReactiveFormsModule,
    DashboardRoutingModule,
    NgxJsonViewerModule
  ],
  declarations: [DashboardComponent, PluginComponent, PluginStatsComponent, ZigateComponent]
})
export class DashboardModule {}
