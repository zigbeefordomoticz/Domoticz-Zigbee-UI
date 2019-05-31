import { Component, OnInit } from '@angular/core';

import { environment } from '@env/environment';
import { Logger } from '@app/core';

const log = new Logger('GroupComponent');

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  version: string = environment.version;

  constructor() {}

  ngOnInit() {}
}
