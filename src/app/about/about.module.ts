import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { AboutRoutingModule } from './about-routing.module';
import { AboutComponent } from './about.component';
import { AboutEnComponent } from './en-US/en-US.component';
import { AboutEsComponent } from './es-ES/es-ES.component';
import { AboutFrComponent } from './fr-FR/fr-FR.component';
import { AboutNlComponent } from './nl-NL/nl-NL.component';
import { AboutDeComponent } from './de-DE/de-DE.component';
import { AboutItComponent } from './it-IT/it-IT.component';

@NgModule({
  imports: [CommonModule, TranslateModule, AboutRoutingModule],
  declarations: [AboutComponent, AboutEnComponent, AboutEsComponent, AboutNlComponent, AboutFrComponent, AboutDeComponent, AboutItComponent]
})
export class AboutModule {}
