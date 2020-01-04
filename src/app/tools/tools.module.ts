import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ColorPickerModule } from 'ngx-color-picker';
import { FileSaverModule } from 'ngx-filesaver';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { DebugCommandComponent } from './debug-command/debug-command.component';
import { PluginComponent } from './plugin/plugin.component';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsComponent } from './tools.component';
import { ZigateComponent } from './zigate/zigate.component';
import { BindingComponent } from './binding/binding.component';

@NgModule({
  imports: [SharedModule, ToolsRoutingModule, NgxJsonViewerModule, FileSaverModule, ColorPickerModule],
  declarations: [ToolsComponent, PluginComponent, ZigateComponent, DebugCommandComponent, BindingComponent]
})
export class ToolsModule {}
