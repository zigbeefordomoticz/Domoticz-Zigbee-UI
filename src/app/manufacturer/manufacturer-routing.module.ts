import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { extract } from '@app/core';
import { CasaiaComponent } from './casaia/casaia.component';
import { ZlinkyComponent } from './zlinky/zlinky.component';
import { GammaComponent } from './gamma/gamma.component';
import { ChameleonComponent } from './chameleontechnology/chameleon.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: 'casaia', component: CasaiaComponent, data: { title: extract('manufacturer.casaia') } },
  { path: 'zlinky', component: ZlinkyComponent, data: { title: extract('manufacturer.zlinky') } },
  { path: 'gamma', component: GammaComponent, data: { title: extract('manufacturer.gamma') } },
  { path: 'chameleon', component: ChameleonComponent, data: { title: extract('manufacturer.chameleon') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class ManufacturerRoutingModule {}
