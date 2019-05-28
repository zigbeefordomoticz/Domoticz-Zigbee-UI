import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { NotifyService } from '../services/notify.service';

const log = new Logger('SettingsComponent');

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  constructor(private notifyService: NotifyService, private translate: TranslateService) {}

  ngOnInit() {}
}
