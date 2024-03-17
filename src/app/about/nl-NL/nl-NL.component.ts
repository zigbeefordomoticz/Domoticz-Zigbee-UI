import { Component } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-about-nl',
  templateUrl: './nl-NL.component.html',
  styleUrls: ['./nl-NL.component.scss']
})
export class AboutNlComponent {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;
}
