import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { DeviceDetailsComponent } from './device-details.component';

// The Details window, opened from Device Management and from the dashboard device list
@NgModule({
  imports: [SharedModule],
  declarations: [DeviceDetailsComponent],
  exports: [DeviceDetailsComponent]
})
export class DeviceDetailsModule {}
