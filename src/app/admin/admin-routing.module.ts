import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { extract } from '@app/core';
import { AdminComponent } from './admin.component';
import { FirmwareComponent } from './firmware/firmware.component';
import { FirmwareUpdatesComponent } from './firmware-updates/firmware-updates.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: AdminComponent, data: { title: extract('admin') } },
  { path: 'firmware', component: FirmwareComponent, data: { title: extract('admin.firmware') } },
  // Opened from the dashboard's "Firmware update available"
  { path: 'firmware/updates', component: FirmwareUpdatesComponent, data: { title: extract('admin.firmware.updates') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class AdminRoutingModule {}
