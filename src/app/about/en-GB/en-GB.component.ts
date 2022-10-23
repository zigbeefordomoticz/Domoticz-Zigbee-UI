import { Component, OnInit } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';
import { environment } from '@env/environment';

@Component({
  selector: 'app-about-en',
  templateUrl: './en-GB.component.html',
  styleUrls: ['./en-GB.component.scss']
})
export class AboutEnComponent implements OnInit {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;
  constructor() { }

  ngOnInit() { }
}
