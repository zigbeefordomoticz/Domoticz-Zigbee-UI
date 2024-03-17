import { Component } from '@angular/core';

import { I18nService } from '@app/core';
import { environment } from '@env/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  version: string = environment.version;

  constructor(public readonly i18nService: I18nService) {}
}
