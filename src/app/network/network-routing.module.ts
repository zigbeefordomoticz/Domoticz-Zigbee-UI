import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { NetworkComponent } from './network.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: NetworkComponent, data: { title: extract('network') } },
  { path: 'topology', component: NetworkComponent, data: { title: extract('network.topo') } },
  { path: 'energy-level', component: NetworkComponent, data: { title: extract('network.energy') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class NetworkRoutingModule {}
