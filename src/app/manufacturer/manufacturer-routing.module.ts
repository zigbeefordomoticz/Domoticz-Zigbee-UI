import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { extract } from '@app/core';
import { CasaiaComponent } from './casaia/casaia.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: 'casaia', component: CasaiaComponent, data: { title: extract('manufacturer') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class ManufacturerRoutingModule {}
