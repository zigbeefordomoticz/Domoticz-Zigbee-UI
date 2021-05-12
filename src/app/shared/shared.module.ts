import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { LoaderComponent } from './loader/loader.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';

@NgModule({
  imports: [CommonModule, NgSelectModule, NgOptionHighlightModule, TranslateModule, NgxDatatableModule],
  declarations: [LoaderComponent],
  providers: [DatePipe],
  exports: [
    CommonModule,
    LoaderComponent,
    ReactiveFormsModule,
    NgSelectModule,
    TranslateModule,
    NgxDatatableModule,
    DatePipe,
    NgxSpinnerModule,
    NgOptionHighlightModule
  ]
})
export class SharedModule {}
