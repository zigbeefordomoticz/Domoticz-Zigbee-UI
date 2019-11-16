import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgBootstrapFormValidationModule } from 'ng-bootstrap-form-validation';
import { LoaderComponent } from './loader/loader.component';
import { NgxSpinnerModule } from 'ngx-spinner';

@NgModule({
  imports: [CommonModule, NgBootstrapFormValidationModule, NgSelectModule, TranslateModule, NgxDatatableModule],
  declarations: [LoaderComponent],
  providers: [DatePipe],
  exports: [
    CommonModule,
    LoaderComponent,
    ReactiveFormsModule,
    NgBootstrapFormValidationModule,
    NgSelectModule,
    TranslateModule,
    NgxDatatableModule,
    DatePipe,
    NgxSpinnerModule
  ]
})
export class SharedModule {}
