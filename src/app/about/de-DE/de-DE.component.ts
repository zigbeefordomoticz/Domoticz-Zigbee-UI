import { Component } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-about-de',
  templateUrl: './de-DE.component.html',
  styleUrls: ['./de-DE.component.scss']
})
export class AboutDeComponent {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;
}
