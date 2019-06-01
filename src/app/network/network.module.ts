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
import { DetailTopologyComponent } from './detail-topology/detail-topology.component';
import { PerfectScrollbarModule, PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { ReqTopologyComponent } from './req-topology/req-topology.component';
import { ReqNetworkInterComponent } from './req-network-inter/req-network-inter.component';
import { DetailNwkStatComponent } from './detail-nwk-stat/detail-nwk-stat.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

@NgModule({
  imports: [NetworkRoutingModule, SharedModule, ChartModule, PerfectScrollbarModule],
  declarations: [
    NetworkComponent,
    NwkStatsComponent,
    TopologyComponent,
    DetailTopologyComponent,
    ReqTopologyComponent,
    ReqNetworkInterComponent,
    DetailNwkStatComponent
  ],
  providers: [
    { provide: HIGHCHARTS_MODULES, useFactory: () => [more, exporting, sankey, wheel] },
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ]
})
export class NetworkModule {}
