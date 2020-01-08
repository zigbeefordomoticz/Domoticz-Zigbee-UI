import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';

const log = new Logger('CommandComponent');

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss']
})
export class CommandComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
