import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';

const log = new Logger('DashboardComponent');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
