import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '@app/shared';
import { GroupRoutingModule } from './group-routing.module';
import { GroupComponent } from './group.component';
import { GroupScenesComponent } from './group-scenes.component';
import { SceneDevicePickerComponent } from './scene-device-picker.component';
import { SceneMembersComponent } from './scene-members.component';
import { ScenesOverviewComponent } from './scenes-overview.component';

@NgModule({
  imports: [GroupRoutingModule, SharedModule, FormsModule],
  declarations: [
    GroupComponent,
    GroupScenesComponent,
    SceneDevicePickerComponent,
    SceneMembersComponent,
    ScenesOverviewComponent
  ]
})
export class GroupModule {}
