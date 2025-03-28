import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { DetailNwkStatComponent } from './detail-nwk-stat/detail-nwk-stat.component';
import { DetailTopologyComponent } from './detail-topology/detail-topology.component';
import { NetworkRoutingModule } from './network-routing.module';
import { NwkStatsComponent } from './nwk-stats/nwk-stats.component';
import { ReqNetworkFullComponent } from './req-network-full/req-network-full.component';
import { ReqNetworkInterComponent } from './req-network-inter/req-network-inter.component';
import { ReqTopologyComponent } from './req-topology/req-topology.component';
import { TopologyComponent } from './topology/topology.component';
import { HighchartsChartModule } from 'highcharts-angular';

@NgModule({
  imports: [NetworkRoutingModule, SharedModule, HighchartsChartModule, NgScrollbarModule],
  declarations: [
    NwkStatsComponent,
    TopologyComponent,
    DetailTopologyComponent,
    ReqTopologyComponent,
    ReqNetworkInterComponent,
    DetailNwkStatComponent,
    ReqNetworkFullComponent
  ]
})
export class NetworkModule {}
