import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@app/shared';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';
import { DeviceDetailsModule } from './device-details/device-details.module';
import { DeviceParamEditorComponent } from './device-param-editor/device-param-editor.component';
import { DeviceRoutingModule } from './device-routing.module';
import { DeviceComponent } from './device.component';

@NgModule({
  imports: [DeviceRoutingModule, SharedModule, FormsModule, DeviceDetailsModule],
  declarations: [DeviceComponent, DeviceByNameComponent, DeviceParamEditorComponent]
})
export class DeviceModule {}
