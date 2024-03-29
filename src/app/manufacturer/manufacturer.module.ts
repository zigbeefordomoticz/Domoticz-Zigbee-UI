import { ZlinkyComponent } from './zlinky/zlinky.component';
import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ManufacturerRoutingModule } from './manufacturer-routing.module';
import { CasaiaComponent } from './casaia/casaia.component';

@NgModule({
  imports: [ManufacturerRoutingModule, SharedModule],
  declarations: [CasaiaComponent, ZlinkyComponent]
})
export class ManufacturerModule {}
