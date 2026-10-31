import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { ErasePdmComponent } from './erase-pdm/erase-pdm.component';
import { FirmwareComponent } from './firmware/firmware.component';
import { RescanGroupComponent } from './rescan-group/rescan-group.component';
import { ScanGroupDeviceComponent } from './scan-group-device/scan-group-device.component';
import { SwResetComponent } from './sw-reset/sw-reset.component';
import { SwitchChannelComponent } from './switch-channel/switch-channel.component';
import { AdminPluginComponent } from './admin-plugin/admin-plugin.component';
import { AdminTabsComponent } from './admin-tabs/admin-tabs.component';
import { AdminProvisioningComponent } from './admin-provisioning/admin-provisioning.component';

@NgModule({
  imports: [AdminRoutingModule, SharedModule],
  declarations: [
    AdminComponent,
    FirmwareComponent,
    SwResetComponent,
    ErasePdmComponent,
    RescanGroupComponent,
    ScanGroupDeviceComponent,
    SwitchChannelComponent,
    AdminTabsComponent,
    AdminPluginComponent,
    AdminProvisioningComponent
  ]
})
export class AdminModule {}
