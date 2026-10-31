import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ColorPickerModule } from 'ngx-color-picker';
import { FileSaverModule } from 'ngx-filesaver';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { BindingComponent } from './binding/binding.component';
import { CommandComponent } from './command/command.component';
import { RawCommandComponent } from './command/raw-command/raw-command.component';
import { DebugSettingsComponent } from './debug-settings/debug-settings.component';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsTabsComponent } from './tools-tabs/tools-tabs.component';
import { ToolsComponent } from './tools.component';
import { ErrorComponent } from './error/error.component';

@NgModule({
  imports: [SharedModule, ToolsRoutingModule, NgxJsonViewerModule, FileSaverModule, ColorPickerModule],
  declarations: [
    ToolsComponent,
    ToolsTabsComponent,
    BindingComponent,
    RawCommandComponent,
    CommandComponent,
    DebugSettingsComponent,
    ErrorComponent
  ]
})
export class ToolsModule {}
