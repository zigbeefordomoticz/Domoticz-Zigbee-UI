import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { AssistProvisionningComponent } from './assist-provisionning/assist-provisionning.component';
import { ErasePdmComponent } from './erase-pdm/erase-pdm.component';
import { PermitToJoinRouterComponent } from './permit-to-join-router/permit-to-join-router.component';
import { PermitToJoinComponent } from './permit-to-join/permit-to-join.component';
import { ReloadPluginComponent } from './reload-plugin/reload-plugin.component';
import { RescanGroupComponent } from './rescan-group/rescan-group.component';
import { SwResetComponent } from './sw-reset/sw-reset.component';
import { ScanGroupDeviceComponent } from './scan-group-device/scan-group-device.component';

@NgModule({
  imports: [AdminRoutingModule, SharedModule],
  declarations: [
    AdminComponent,
    PermitToJoinComponent,
    PermitToJoinRouterComponent,
    SwResetComponent,
    ErasePdmComponent,
    ReloadPluginComponent,
    RescanGroupComponent,
    AssistProvisionningComponent,
    ScanGroupDeviceComponent
  ]
})
export class AdminModule {}
