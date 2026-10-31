import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';

@NgModule({
  imports: [SettingsRoutingModule, SharedModule],
  declarations: [SettingsComponent]
})
export class SettingsModule {}
