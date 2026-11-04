import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@app/shared';
import { GroupRoutingModule } from './group-routing.module';
import { GroupComponent } from './group.component';
import { GroupScenesComponent } from './group-scenes.component';

@NgModule({
  imports: [GroupRoutingModule, SharedModule, FormsModule],
  declarations: [GroupComponent, GroupScenesComponent]
})
export class GroupModule {}
