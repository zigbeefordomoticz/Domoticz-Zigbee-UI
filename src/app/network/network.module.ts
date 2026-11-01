import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as wheel from 'highcharts/modules/dependency-wheel.src';
import * as exporting from 'highcharts/modules/exporting.src';
import * as network from 'highcharts/modules/networkgraph.src';
import * as offlineExporting from 'highcharts/modules/offline-exporting.src';
import * as sankey from 'highcharts/modules/sankey.src';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { DetailTopologyComponent } from './detail-topology/detail-topology.component';
import { MeshGraphComponent } from './mesh/mesh-graph/mesh-graph.component';
import { MeshComponent } from './mesh/mesh.component';
import { NetworkInterferenceComponent } from './network-interference/network-interference.component';
import { NetworkTabsComponent } from './network-tabs/network-tabs.component';
import { NetworkComponent } from './network.component';
import { NetworkRoutingModule } from './network-routing.module';
import { ReqTopologyComponent } from './req-topology/req-topology.component';
import { TopologyComponent } from './topology/topology.component';

@NgModule({
  imports: [NetworkRoutingModule, SharedModule, ChartModule, NgScrollbarModule],
  declarations: [
    NetworkComponent,
    NetworkTabsComponent,
    TopologyComponent,
    DetailTopologyComponent,
    MeshComponent,
    MeshGraphComponent,
    ReqTopologyComponent,
    NetworkInterferenceComponent
  ],
  providers: [
    { provide: HIGHCHARTS_MODULES, useFactory: () => [more, exporting, offlineExporting, sankey, wheel, network] }
  ]
})
export class NetworkModule {}
