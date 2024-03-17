import { Component } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-about-es',
  templateUrl: './es-ES.component.html',
  styleUrls: ['./es-ES.component.scss']
})
export class AboutEsComponent {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;
}
