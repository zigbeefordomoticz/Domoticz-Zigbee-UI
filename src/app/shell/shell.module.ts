import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ShellComponent } from './shell.component';
import { HeaderComponent } from './header/header.component';
import { VersionComponent } from './version/version.component';
import { FormsModule } from '@angular/forms';
import { NgBootstrapDarkmodeModule } from 'ng-bootstrap-darkmode';

@NgModule({
  imports: [CommonModule, TranslateModule, NgbModule, FormsModule, NgBootstrapDarkmodeModule, RouterModule],
  declarations: [HeaderComponent, ShellComponent, VersionComponent]
})
export class ShellModule {}
