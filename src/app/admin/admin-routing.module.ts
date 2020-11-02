import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { AdminComponent } from './admin.component';
import { FirmwareComponent } from './firmware/firmware.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: AdminComponent, data: { title: extract('admin') } },
  { path: 'firmware', component: FirmwareComponent, data: { title: extract('admin.firmware') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class AdminRoutingModule {}
