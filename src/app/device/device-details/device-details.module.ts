import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { DeviceDetailsComponent } from './device-details.component';
import { GreenPowerDetailsComponent } from './green-power-details.component';

// The Details window, opened from Device Management and from the dashboard device list; a Green Power device has its own
@NgModule({
  imports: [SharedModule],
  declarations: [DeviceDetailsComponent, GreenPowerDetailsComponent],
  exports: [DeviceDetailsComponent, GreenPowerDetailsComponent]
})
export class DeviceDetailsModule {}
