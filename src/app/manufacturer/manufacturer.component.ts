import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { HeaderService } from '@app/services/header-service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CasaiaDevice } from '../shared/models/casaia-device';

const log = new Logger('ManufacturerComponent');

@Component({
  selector: 'app-manufacturer',
  templateUrl: './manufacturer.component.html',
  styleUrls: ['./manufacturer.component.scss']
})
export class ManufacturerComponent implements OnInit {
  form: FormGroup;
  rows: CasaiaDevice[];
  columns = [{ prop: 'IEEE' }, { prop: 'IRCode' }, { prop: 'Model' }, { prop: 'Name' }, { prop: 'NwkId' }];

  constructor(
    private modalService: NgbModal,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private headerService: HeaderService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({});
    this.rows = JSON.parse(localStorage.getItem('casaiaDevice'));
  }
}
