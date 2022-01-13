import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('RawCommandComponent');

@Component({
  selector: 'app-raw-command',
  templateUrl: './raw-command.component.html',
  styleUrls: ['./raw-command.component.scss']
})
export class RawCommandComponent implements OnInit {
  form: FormGroup;

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      Command: [null, Validators.required],
      payload: [null]
    });
  }

  putCommand() {
    this.apiService.putCommandRaw(this.form.value).subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.commandsent.notify'));
    });
  }
}
