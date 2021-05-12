import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as exporting from 'highcharts/modules/exporting.src';
import * as network from 'highcharts/modules/networkgraph.src';
import * as sankey from 'highcharts/modules/sankey.src';
import {
  PerfectScrollbarConfigInterface,
  PerfectScrollbarModule,
  PERFECT_SCROLLBAR_CONFIG,
} from 'ngx-perfect-scrollbar';
import * as wheel from 'highcharts/modules/dependency-wheel.src';
import { DetailNwkStatComponent } from './detail-nwk-stat/detail-nwk-stat.component';
import { DetailTopologyComponent } from './detail-topology/detail-topology.component';
import { NetworkRoutingModule } from './network-routing.module';
import { NwkStatsComponent } from './nwk-stats/nwk-stats.component';
import { ReqNetworkInterComponent } from './req-network-inter/req-network-inter.component';
import { ReqTopologyComponent } from './req-topology/req-topology.component';
import { TopologyComponent } from './topology/topology.component';
import { ReqNetworkFullComponent } from './req-network-full/req-network-full.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
};

@NgModule({
  imports: [NetworkRoutingModule, SharedModule, ChartModule, PerfectScrollbarModule],
  declarations: [
    NwkStatsComponent,
    TopologyComponent,
    DetailTopologyComponent,
    ReqTopologyComponent,
    ReqNetworkInterComponent,
    DetailNwkStatComponent,
    ReqNetworkFullComponent,
  ],
  providers: [
    { provide: HIGHCHARTS_MODULES, useFactory: () => [more, exporting, sankey, wheel, network] },
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
  ],
})
export class NetworkModule {}
