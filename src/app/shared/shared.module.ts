import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { LoaderComponent } from './loader/loader.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { nl2brPipe } from './utils/nl2br.pipe';

@NgModule({
  imports: [CommonModule, NgSelectModule, NgOptionHighlightModule, TranslateModule, NgxDatatableModule],
  declarations: [LoaderComponent, nl2brPipe],
  providers: [DatePipe],
  exports: [
    CommonModule,
    LoaderComponent,
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    TranslateModule,
    NgxDatatableModule,
    DatePipe,
    NgxSpinnerModule,
    NgOptionHighlightModule,
    nl2brPipe
  ]
})
export class SharedModule {}
