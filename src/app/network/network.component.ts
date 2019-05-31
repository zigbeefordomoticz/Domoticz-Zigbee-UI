import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';

const log = new Logger('NetworkComponent');

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit {
  timeStamp: string;

  constructor() {}

  ngOnInit() {}

  timeStampChange(event: any) {
    this.timeStamp = event;
  }
}
