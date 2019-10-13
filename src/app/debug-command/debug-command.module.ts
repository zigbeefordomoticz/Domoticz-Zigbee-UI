import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { DebugCommandRoutingModule } from './debug-command-routing.module';
import { DebugCommandComponent } from './debug-command.component';
import { ColorPickerModule } from 'ngx-color-picker';

@NgModule({
  imports: [SharedModule, DebugCommandRoutingModule, ColorPickerModule],
  declarations: [DebugCommandComponent]
})
export class DebugCommandModule {}
