import { Component, OnInit } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';
import { environment } from '@env/environment';

@Component({
  selector: 'app-about-nl',
  templateUrl: './nl-NL.component.html',
  styleUrls: ['./nl-NL.component.scss']
})
export class AboutNlComponent implements OnInit {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;

  constructor() {}

  ngOnInit() {}
}
