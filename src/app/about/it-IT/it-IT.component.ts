import { Component } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-about-it',
  templateUrl: './it-IT.component.html',
  styleUrls: ['./it-IT.component.scss']
})
export class AboutItComponent {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;
}
