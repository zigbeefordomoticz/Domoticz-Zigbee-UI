import { Component } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-about-fr',
  templateUrl: './fr-FR.component.html',
  styleUrls: ['./fr-FR.component.scss']
})
export class AboutFrComponent {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;
}
