import { Component, OnInit } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';
import { environment } from '@env/environment';

@Component({
  selector: 'app-about-fr',
  templateUrl: './fr-FR.component.html',
  styleUrls: ['./fr-FR.component.scss']
})
export class AboutFrComponent implements OnInit {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;

  constructor() {}

  ngOnInit() {}
}
