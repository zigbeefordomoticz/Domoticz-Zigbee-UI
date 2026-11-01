import { inject, NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';
import { extract } from '@app/core';
import { NetworkComponent } from './network.component';

// The views had their own address before they became tabs; bookmarks and old links still open the right one
const toTab = (view: string) => () => inject(Router).createUrlTree(['/network'], { queryParams: { view } });

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: NetworkComponent, data: { title: extract('network') } },
  { path: 'mesh', redirectTo: toTab('mesh') },
  { path: 'topology', redirectTo: toTab('topology') },
  { path: 'energy-level', redirectTo: toTab('interference') }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class NetworkRoutingModule {}
