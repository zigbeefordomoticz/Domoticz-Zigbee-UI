import { Component, OnInit } from '@angular/core';

import { environment } from '@env/environment';
import { I18nService, Logger } from '@app/core';

const log = new Logger('AboutComponent');

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit {
  version: string = environment.version;

  constructor(public readonly i18nService: I18nService) {}

  ngOnInit() {}
}
