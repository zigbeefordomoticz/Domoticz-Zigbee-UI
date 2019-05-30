import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { SharedModule } from '@app/shared';
import { PermitToJoinComponent } from './permit-to-join/permit-to-join.component';
import { SwResetComponent } from './sw-reset/sw-reset.component';
import { ErasePdmComponent } from './erase-pdm/erase-pdm.component';

@NgModule({
  imports: [AdminRoutingModule, SharedModule],
  declarations: [AdminComponent, PermitToJoinComponent, SwResetComponent, ErasePdmComponent]
})
export class AdminModule {}
