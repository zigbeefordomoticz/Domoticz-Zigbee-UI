import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@app/shared';
import { GroupRoutingModule } from './group-routing.module';
import { GroupComponent } from './group.component';

@NgModule({
  imports: [GroupRoutingModule, SharedModule, FormsModule],
  declarations: [GroupComponent],
})
export class GroupModule {}
