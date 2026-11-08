import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { ErasePdmComponent } from './erase-pdm/erase-pdm.component';
import { FirmwareComponent } from './firmware/firmware.component';
import { AdminPluginComponent } from './admin-plugin/admin-plugin.component';
import { AdminTabsComponent } from './admin-tabs/admin-tabs.component';
import { AdminProvisioningComponent } from './admin-provisioning/admin-provisioning.component';
import { AdminGroupsComponent } from './admin-groups/admin-groups.component';
import { AdminCoordinatorComponent } from './admin-coordinator/admin-coordinator.component';
import { AdminGreenPowerComponent } from './admin-green-power/admin-green-power.component';
import { FirmwareUpdatesComponent } from './firmware-updates/firmware-updates.component';
import { FirmwareWarningComponent } from './firmware-warning/firmware-warning.component';

@NgModule({
  imports: [AdminRoutingModule, SharedModule],
  declarations: [
    AdminComponent,
    FirmwareComponent,
    ErasePdmComponent,
    AdminTabsComponent,
    AdminPluginComponent,
    AdminProvisioningComponent,
    AdminGreenPowerComponent,
    AdminGroupsComponent,
    AdminCoordinatorComponent,
    FirmwareUpdatesComponent,
    FirmwareWarningComponent
  ]
})
export class AdminModule {}
