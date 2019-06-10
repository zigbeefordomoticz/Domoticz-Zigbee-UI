import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsComponent } from './tools.component';

@NgModule({
  imports: [SharedModule, ToolsRoutingModule, NgxJsonViewerModule],
  declarations: [ToolsComponent]
})
export class ToolsModule {}
