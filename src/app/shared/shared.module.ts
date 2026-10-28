import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { CustomIconComponent } from './components/custom-icon.component';
import { nl2brPipe } from './utils/nl2br.pipe';
import { HealthLabelPipe } from './utils/health-label.pipe';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SliderModule } from 'primeng/slider';

@NgModule({
  imports: [CommonModule, NgSelectModule, TranslateModule],
  declarations: [nl2brPipe, HealthLabelPipe, CustomIconComponent],
  providers: [DatePipe],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    NgSelectModule,
    TranslateModule,
    TableModule,
    DialogModule,
    SliderModule,
    InputTextModule,
    ButtonModule,
    DatePipe,
    CustomIconComponent,
    NgxSpinnerModule,
    nl2brPipe,
    HealthLabelPipe
  ]
})
export class SharedModule {}
