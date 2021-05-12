import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { SettingComponent } from './setting/setting.component';
import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';

@NgModule({
  imports: [SettingsRoutingModule, SharedModule],
  declarations: [SettingsComponent, SettingComponent],
})
export class SettingsModule {}
