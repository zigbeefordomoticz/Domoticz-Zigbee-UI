import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { HeaderComponent } from './header/header.component';
import { ShellComponent } from './shell.component';
import { VersionComponent } from './version/version.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    NgbModule,
    FormsModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    RouterModule
  ],
  declarations: [HeaderComponent, ShellComponent, VersionComponent]
})
export class ShellModule {}
