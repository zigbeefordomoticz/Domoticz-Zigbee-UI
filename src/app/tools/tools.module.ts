import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ColorPickerModule } from 'ngx-color-picker';
import { FileSaverModule } from 'ngx-filesaver';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { DebugSettingsComponent } from './debug-settings/debug-settings.component';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsTabsComponent } from './tools-tabs/tools-tabs.component';
import { ToolsComponent } from './tools.component';
import { ErrorComponent } from './error/error.component';

@NgModule({
  imports: [SharedModule, ToolsRoutingModule, NgxJsonViewerModule, FileSaverModule, ColorPickerModule],
  declarations: [ToolsComponent, ToolsTabsComponent, DebugSettingsComponent, ErrorComponent]
})
export class ToolsModule {}
