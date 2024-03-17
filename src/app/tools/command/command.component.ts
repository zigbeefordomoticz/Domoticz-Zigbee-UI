import { Component, OnInit } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-command',
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss']
})
export class CommandComponent implements OnInit {
  plugin: Plugin;

  ngOnInit() {
    setTimeout(() => {
      this.plugin = JSON.parse(sessionStorage.getItem('plugin'));
    }, 500);
  }
}
