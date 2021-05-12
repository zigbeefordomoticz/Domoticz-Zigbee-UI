import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { extract } from '@app/core';
import { NwkStatsComponent } from './nwk-stats/nwk-stats.component';
import { TopologyComponent } from './topology/topology.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: 'topology', component: TopologyComponent, data: { title: extract('network.topo') } },
  { path: 'energy-level', component: NwkStatsComponent, data: { title: extract('network.energy') } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [],
})
export class NetworkRoutingModule {}
