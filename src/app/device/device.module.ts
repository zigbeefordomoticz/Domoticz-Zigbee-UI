import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { DeviceRoutingModule } from './device-routing.module';
import { DeviceComponent } from './device.component';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [DeviceRoutingModule, SharedModule, FormsModule],
  declarations: [DeviceComponent, DeviceByNameComponent]
})
export class DeviceModule {}
