import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxSpinnerModule } from 'ngx-spinner';
import { nl2brPipe } from './utils/nl2br.pipe';
import { CustomIconComponent } from './components/custom-icon.component';

@NgModule({
  imports: [CommonModule, NgSelectModule, NgOptionHighlightModule, TranslateModule, NgxDatatableModule],
  declarations: [nl2brPipe, CustomIconComponent],
  providers: [DatePipe],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    TranslateModule,
    NgxDatatableModule,
    DatePipe,
    CustomIconComponent,
    NgxSpinnerModule,
    NgOptionHighlightModule,
    nl2brPipe
  ]
})
export class SharedModule {}
