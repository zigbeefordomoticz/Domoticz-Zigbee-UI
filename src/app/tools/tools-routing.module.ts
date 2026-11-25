import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { extract } from '@app/core';
import { DebugSettingsComponent } from './debug-settings/debug-settings.component';
import { ErrorComponent } from './error/error.component';
import { ToolsComponent } from './tools.component';

const routes: Routes = [
  { path: 'debug', component: DebugSettingsComponent, data: { title: extract('debug') } },
  { path: 'link', component: ToolsComponent, data: { title: extract('tools') } },
  { path: 'error', component: ErrorComponent, data: { title: extract('error') } },
  // The Tools menu entry opens the first tab
  { path: '', redirectTo: 'link', pathMatch: 'full' },
  // Command and Binding / Reporting are Admin tabs; their former addresses still work
  { path: 'command', redirectTo: '/admin/command', pathMatch: 'full' },
  { path: 'binding', redirectTo: '/admin/binding', pathMatch: 'full' },
  { path: 'configure', redirectTo: '/admin/binding', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class ToolsRoutingModule {}
