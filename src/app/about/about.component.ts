import { Component, OnInit } from '@angular/core';
import { Observable, EMPTY } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

import { I18nService } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Plugin } from '@app/shared/models/plugin';

// A credit line: contributors, optionally qualified by the language they translated.
interface Credit {
  role: string;
  groups: { names: string[]; language?: string }[];
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: false
})
export class AboutComponent implements OnInit {
  version$: Observable<string>;
  readonly year = new Date().getFullYear();

  // Interpolated into the about.* translations, so each URL is written once
  // rather than once per language.
  readonly links = {
    wiki: 'https://zigbeefordomoticz.github.io/wiki/',
    englishForum: 'https://forum.domoticz.com/viewforum.php?f=68',
    frenchForum: 'https://easydomoticz.com/forum/viewforum.php?f=28',
    keybase: 'https://keybase.io/team/zigate',
    zigate: 'https://zigate.fr/',
    electrolama: 'https://shop.electrolama.com/',
    elelabs: 'https://elelabs.com/',
    casaia: 'https://casaia.fr/boutique/'
  };
  readonly paypal = 'https://www.paypal.com/paypalme/pipiche';

  readonly manufacturers = [
    'about.thanks.lixee',
    'about.thanks.electrolama',
    'about.thanks.elelabs',
    'about.thanks.legrand',
    'about.thanks.casaia'
  ];

  readonly credits: Credit[] = [
    {
      role: 'about.credits.plugin',
      groups: [
        {
          names: [
            'zaraki673',
            'Pipiche38',
            '2m2',
            'd2e2n2o',
            'karstenbakker',
            'ricky74',
            'sbhc68',
            'thiklop',
            'deufo',
            'badz'
          ]
        }
      ]
    },
    { role: 'about.credits.webui', groups: [{ names: ['ben33880'] }] },
    {
      role: 'about.credits.webuiTranslation',
      groups: [
        { names: ['gemies', 'marktn'], language: 'nl' },
        { names: ['martial83', 'hydci', 'jp-keros'], language: 'fr' }
      ]
    },
    { role: 'about.credits.wiki', groups: [{ names: ['Pipiche38', 'jp-keros'] }] },
    {
      role: 'about.credits.wikiTranslation',
      groups: [
        { names: ['karstenbakker'], language: 'nl' },
        { names: ['jp-keros', 'newturtle'], language: 'fr' },
        { names: ['erwan'], language: 'es' }
      ]
    }
  ];

  constructor(
    public readonly i18nService: I18nService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Ask the plugin rather than rely on sessionStorage, which is empty when
    // /about is the first page opened in a tab. ApiService already reports a
    // failure, so keep whatever version was stored.
    const stored = (JSON.parse(sessionStorage.getItem('plugin')) as Plugin)?.PluginVersion;
    this.version$ = this.apiService.getPlugin().pipe(
      map(plugin => plugin?.PluginVersion),
      catchError(() => EMPTY),
      startWith(stored)
    );
  }

  // "@a, @b and @c (Dutch), @d (French)" in the current UI language.
  describe(credit: Credit): string {
    const language = this.i18nService.language;
    const names = new Intl.ListFormat(language, { type: 'conjunction' });
    const languages = new Intl.DisplayNames(language, { type: 'language' });
    return credit.groups
      .map(group => {
        const list = names.format(group.names.map(name => '@' + name));
        return group.language ? `${list} (${languages.of(group.language)})` : list;
      })
      .join(', ');
  }
}
