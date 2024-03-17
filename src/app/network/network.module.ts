import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as wheel from 'highcharts/modules/dependency-wheel.src';
import * as exporting from 'highcharts/modules/exporting.src';
import * as network from 'highcharts/modules/networkgraph.src';
import * as sankey from 'highcharts/modules/sankey.src';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { DetailNwkStatComponent } from './detail-nwk-stat/detail-nwk-stat.component';
import { DetailTopologyComponent } from './detail-topology/detail-topology.component';
import { NetworkRoutingModule } from './network-routing.module';
import { NwkStatsComponent } from './nwk-stats/nwk-stats.component';
import { ReqNetworkFullComponent } from './req-network-full/req-network-full.component';
import { ReqNetworkInterComponent } from './req-network-inter/req-network-inter.component';
import { ReqTopologyComponent } from './req-topology/req-topology.component';
import { TopologyComponent } from './topology/topology.component';

@NgModule({
  imports: [NetworkRoutingModule, SharedModule, ChartModule, NgScrollbarModule],
  declarations: [
    NwkStatsComponent,
    TopologyComponent,
    DetailTopologyComponent,
    ReqTopologyComponent,
    ReqNetworkInterComponent,
    DetailNwkStatComponent,
    ReqNetworkFullComponent
  ],
  providers: [{ provide: HIGHCHARTS_MODULES, useFactory: () => [more, exporting, sankey, wheel, network] }]
})
export class NetworkModule {}
