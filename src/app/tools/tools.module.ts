import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { FileSaverModule } from 'ngx-filesaver';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { BindingComponent } from './binding/binding.component';
import { CommandComponent } from './command/command.component';
import { DebugCommandComponent } from './command/debug-command/debug-command.component';
import { RawCommandComponent } from './command/raw-command/raw-command.component';
import { RawCommandZigpyComponent } from './command/raw-command-zigpy/raw-command-zigpy.component';
import { DebugSettingComponent } from './debug-settings/debug-setting/debug-setting.component';
import { DebugSettingsComponent } from './debug-settings/debug-settings.component';
import { ToolsRoutingModule } from './tools-routing.module';
import { ToolsComponent } from './tools.component';
import { ErrorComponent } from './error/error.component';
import { ReportingComponent } from './reporting/reporting.component';
import { ConfigureReportingComponent } from './reporting/configure/configure.component';
import { ConfigureByClusterReportingComponent } from './reporting/configure-by-cluster/configure-cluster.component';
import { ColorPickerComponent, ColorPickerDirective } from 'ngx-color-picker';

@NgModule({
  imports: [
    SharedModule,
    ToolsRoutingModule,
    NgxJsonViewerModule,
    FileSaverModule,
    ColorPickerComponent,
    ColorPickerDirective
  ],
  declarations: [
    ToolsComponent,
    DebugCommandComponent,
    BindingComponent,
    RawCommandComponent,
    RawCommandZigpyComponent,
    CommandComponent,
    DebugSettingsComponent,
    DebugSettingComponent,
    ErrorComponent,
    ConfigureReportingComponent,
    ReportingComponent,
    ConfigureByClusterReportingComponent
  ]
})
export class ToolsModule {}
