import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { DeviceRoutingModule } from './device-routing.module';
import { DeviceComponent } from './device.component';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';

@NgModule({
  imports: [DeviceRoutingModule, SharedModule],
  declarations: [DeviceComponent, DeviceByNameComponent]
})
export class DeviceModule {}
