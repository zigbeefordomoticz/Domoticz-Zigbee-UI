import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { FileSaverModule } from 'ngx-filesaver';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { PluginComponent } from './plugin/plugin.component';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsComponent } from './tools.component';
import { ZigateComponent } from './zigate/zigate.component';

@NgModule({
  imports: [SharedModule, ToolsRoutingModule, NgxJsonViewerModule, FileSaverModule],
  declarations: [ToolsComponent, PluginComponent, ZigateComponent]
})
export class ToolsModule {}
