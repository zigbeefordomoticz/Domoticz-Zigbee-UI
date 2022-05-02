import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { AssistProvisionningComponent } from './assist-provisionning/assist-provisionning.component';
import { ErasePdmComponent } from './erase-pdm/erase-pdm.component';
import { FirmwareComponent } from './firmware/firmware.component';
import { PermitToJoinRouterComponent } from './permit-to-join-router/permit-to-join-router.component';
import { PermitToJoinComponent } from './permit-to-join/permit-to-join.component';
import { ReloadPluginComponent } from './reload-plugin/reload-plugin.component';
import { RescanGroupComponent } from './rescan-group/rescan-group.component';
import { ScanGroupDeviceComponent } from './scan-group-device/scan-group-device.component';
import { SwResetComponent } from './sw-reset/sw-reset.component';
import { SwitchChannelComponent } from './switch-channel/switch-channel.component';
import { PairingFullResetComponent } from './pairing-full-reset/pairing-full-reset.component';
import { RecreateWidgetComponent } from './recreate-widget/recreate-widget.component';
import { UpdatePluginComponent } from './update-plugin/update-plugin.component';

@NgModule({
  imports: [AdminRoutingModule, SharedModule],
  declarations: [
    AdminComponent,
    FirmwareComponent,
    PermitToJoinComponent,
    PermitToJoinRouterComponent,
    SwResetComponent,
    ErasePdmComponent,
    ReloadPluginComponent,
    RescanGroupComponent,
    AssistProvisionningComponent,
    ScanGroupDeviceComponent,
    SwitchChannelComponent,
    PairingFullResetComponent,
    RecreateWidgetComponent,
    UpdatePluginComponent
  ]
})
export class AdminModule {}
