import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';

const log = new Logger('ReportingComponent');

@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.scss']
})
export class ReportingComponent implements OnInit {
  constructor() {}
  ngOnInit() {}
}
