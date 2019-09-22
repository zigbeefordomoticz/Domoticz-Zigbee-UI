import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { DebugCommandRoutingModule } from './debug-command-routing.module';
import { DebugCommandComponent } from './debug-command.component';

@NgModule({
  imports: [SharedModule, DebugCommandRoutingModule],
  declarations: [DebugCommandComponent]
})
export class DebugCommandModule {}
