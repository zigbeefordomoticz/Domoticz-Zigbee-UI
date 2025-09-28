import { ZlinkyComponent } from './zlinky/zlinky.component';
import { NgModule } from '@angular/core';
import { SharedModule } from '@app/shared';
import { ManufacturerRoutingModule } from './manufacturer-routing.module';
import { CasaiaComponent } from './casaia/casaia.component';
import { GammaComponent } from './gamma/gamma.component';
import { ChameleonComponent } from './chameleontechnology/chameleon.component';

@NgModule({
  imports: [ManufacturerRoutingModule, SharedModule],
  declarations: [CasaiaComponent, ZlinkyComponent, GammaComponent, ChameleonComponent]
})
export class ManufacturerModule {}
