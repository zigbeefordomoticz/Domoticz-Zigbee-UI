import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('BindingComponent');

@Component({
  selector: 'app-binding',
  templateUrl: './binding.component.html',
  styleUrls: ['./binding.component.scss']
})
export class BindingComponent implements OnInit {
  form: FormGroup;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder, private translate: TranslateService) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      sourceIeee: [null, Validators.required],
      sourceEp: [null, Validators.required],
      destIeee: [null, Validators.required],
      destEp: [null, Validators.required],
      cluster: [null, Validators.required]
    });
  }

  putBinding() {
    this.apiService.putBinding(this.form.value).subscribe();
  }
}
