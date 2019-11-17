import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { extract } from '@app/core';
import { DebugCommandComponent } from './debug-command.component';

const routes: Routes = [
  // Module is lazy loaded, see app-routing.module.ts
  { path: '', component: DebugCommandComponent, data: { title: extract('debug-command') } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class DebugCommandRoutingModule {}
