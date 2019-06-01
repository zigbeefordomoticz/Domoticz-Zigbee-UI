import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';

const log = new Logger('NetworkComponent');

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss']
})
export class NetworkComponent implements OnInit {
  timeStampTopology: string;
  timeStampNwkStat: string;

  constructor() {}

  ngOnInit() {}

  timeStampTopologyChange(event: any) {
    this.timeStampNwkStat = null;
    this.timeStampTopology = event;
  }

  timeStampNwkStatChange(event: any) {
    this.timeStampTopology = null;
    this.timeStampNwkStat = event;
  }
}
