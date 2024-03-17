import { Component } from '@angular/core';
import { Plugin } from '@app/shared/models/plugin';

@Component({
  selector: 'app-about-en',
  templateUrl: './en-US.component.html',
  styleUrls: ['./en-US.component.scss']
})
export class AboutEnComponent {
  version: string = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin).PluginVersion;
}
