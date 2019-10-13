import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { CommandRoutingModule } from './command-routing.module';
import { CommandComponent } from './command.component';
import { DeviceComponent } from './device/device.component';

@NgModule({
  imports: [SharedModule, CommandRoutingModule],
  declarations: [CommandComponent, DeviceComponent]
})
export class CommandModule {}
