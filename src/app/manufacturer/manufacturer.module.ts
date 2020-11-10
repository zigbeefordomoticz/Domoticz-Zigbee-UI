import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ManufacturerRoutingModule } from './manufacturer-routing.module';
import { ManufacturerComponent } from './manufacturer.component';

@NgModule({
  imports: [ManufacturerRoutingModule, SharedModule],
  declarations: [ManufacturerComponent]
})
export class ManufacturerModule {}
