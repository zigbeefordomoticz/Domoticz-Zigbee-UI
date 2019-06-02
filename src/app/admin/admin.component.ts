import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { TranslateService } from '@ngx-translate/core';
import { NotifyService } from '../services/notify.service';

const log = new Logger('AdminComponent');

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  constructor(private notifyService: NotifyService, private translate: TranslateService) {}

  ngOnInit() {}
}
