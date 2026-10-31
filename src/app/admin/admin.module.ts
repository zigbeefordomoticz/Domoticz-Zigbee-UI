import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { ErasePdmComponent } from './erase-pdm/erase-pdm.component';
import { FirmwareComponent } from './firmware/firmware.component';
import { SwResetComponent } from './sw-reset/sw-reset.component';
import { SwitchChannelComponent } from './switch-channel/switch-channel.component';
import { AdminPluginComponent } from './admin-plugin/admin-plugin.component';
import { AdminTabsComponent } from './admin-tabs/admin-tabs.component';
import { AdminProvisioningComponent } from './admin-provisioning/admin-provisioning.component';
import { AdminGroupsComponent } from './admin-groups/admin-groups.component';

@NgModule({
  imports: [AdminRoutingModule, SharedModule],
  declarations: [
    AdminComponent,
    FirmwareComponent,
    SwResetComponent,
    ErasePdmComponent,
    SwitchChannelComponent,
    AdminTabsComponent,
    AdminPluginComponent,
    AdminProvisioningComponent,
    AdminGroupsComponent
  ]
})
export class AdminModule {}
