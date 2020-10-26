import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { extract } from '@app/core';
import { BindingComponent } from './binding/binding.component';
import { CommandComponent } from './command/command.component';
import { DebugSettingsComponent } from './debug-settings/debug-settings.component';
import { ToolsComponent } from './tools.component';

const routes: Routes = [
  { path: 'command', component: CommandComponent, data: { title: extract('command') } },
  { path: 'debug', component: DebugSettingsComponent, data: { title: extract('debug') } },
  { path: 'binding', component: BindingComponent, data: { title: extract('binding') } },
  { path: 'link', component: ToolsComponent, data: { title: extract('tools') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class ToolsRoutingModule {}
