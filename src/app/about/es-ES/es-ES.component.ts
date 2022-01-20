import { Component, OnInit } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-about-es',
  templateUrl: './es-ES.component.html',
  styleUrls: ['./es-ES.component.scss']
})
export class AboutEsComponent implements OnInit {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;

  constructor() {}

  ngOnInit() {}
}
