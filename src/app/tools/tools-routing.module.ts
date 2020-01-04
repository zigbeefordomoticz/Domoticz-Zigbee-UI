import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { extract } from '@app/core';
import { ToolsComponent } from './tools.component';
import { DebugCommandComponent } from './debug-command/debug-command.component';
import { BindingComponent } from './binding/binding.component';

const routes: Routes = [
  { path: 'debug-command', component: DebugCommandComponent, data: { title: extract('debug-command') } },
  { path: 'binding', component: BindingComponent, data: { title: extract('binding') } },
  { path: 'link', component: ToolsComponent, data: { title: extract('tools') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class ToolsRoutingModule {}
