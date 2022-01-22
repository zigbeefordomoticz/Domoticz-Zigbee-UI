import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { Plugin } from '@app/shared/models/plugin';

const log = new Logger('CommandComponent');

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss']
})
export class CommandComponent implements OnInit {
  plugin: Plugin;

  constructor() {}

  ngOnInit() {
    setTimeout(() => {
      this.plugin = JSON.parse(sessionStorage.getItem('plugin'));
    }, 500);
  }
}
