import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ColorPickerModule } from 'ngx-color-picker';
import { FileSaverModule } from 'ngx-filesaver';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { BindingComponent } from './binding/binding.component';
import { CommandComponent } from './command/command.component';
import { DebugCommandComponent } from './command/debug-command/debug-command.component';
import { RawCommandComponent } from './command/raw-command/raw-command.component';
import { DebugSettingComponent } from './debug-settings/debug-setting/debug-setting.component';
import { DebugSettingsComponent } from './debug-settings/debug-settings.component';
import { PluginComponent } from './plugin/plugin.component';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsComponent } from './tools.component';
import { CoordinatorComponent } from './coordinator/coordinator.component';
import { ErrorComponent } from './error/error.component';

@NgModule({
  imports: [SharedModule, ToolsRoutingModule, NgxJsonViewerModule, FileSaverModule, ColorPickerModule],
  declarations: [
    ToolsComponent,
    PluginComponent,
    CoordinatorComponent,
    DebugCommandComponent,
    BindingComponent,
    RawCommandComponent,
    CommandComponent,
    DebugSettingsComponent,
    DebugSettingComponent,
    ErrorComponent
  ]
})
export class ToolsModule {}
