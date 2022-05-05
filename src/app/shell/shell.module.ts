import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from './header/header.component';
import { ShellComponent } from './shell.component';
import { VersionComponent } from './version/version.component';

@NgModule({
  imports: [CommonModule, TranslateModule, NgbModule, FormsModule, RouterModule],
  declarations: [HeaderComponent, ShellComponent, VersionComponent]
})
export class ShellModule {}
