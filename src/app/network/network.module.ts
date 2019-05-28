import { NgModule } from '@angular/core';
import { NetworkRoutingModule } from './network-routing.module';
import { NetworkComponent } from './network.component';
import { NwkStatsComponent } from './nwk-stats/nwk-stats.component';
import { TopologyComponent } from './topology/topology.component';
import { SharedModule } from '@app/shared';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as sankey from 'highcharts/modules/sankey.src';
import * as wheel from './dependency-wheel.src';
import * as more from 'highcharts/highcharts-more.src';
import * as exporting from 'highcharts/modules/exporting.src';

@NgModule({
  imports: [NetworkRoutingModule, SharedModule, ChartModule],
  declarations: [NetworkComponent, NwkStatsComponent, TopologyComponent],
  providers: [{ provide: HIGHCHARTS_MODULES, useFactory: () => [more, exporting, sankey, wheel] }]
})
export class NetworkModule {}
