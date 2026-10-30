import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@app/shared';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';
import { DeviceDetailsComponent } from './device-details/device-details.component';
import { DeviceParamEditorComponent } from './device-param-editor/device-param-editor.component';
import { DeviceRoutingModule } from './device-routing.module';
import { DeviceComponent } from './device.component';

@NgModule({
  imports: [DeviceRoutingModule, SharedModule, FormsModule],
  declarations: [DeviceComponent, DeviceByNameComponent, DeviceParamEditorComponent, DeviceDetailsComponent]
})
export class DeviceModule {}
