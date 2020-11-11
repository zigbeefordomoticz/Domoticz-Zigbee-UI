import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { I18nService, Logger, untilDestroyed } from '@app/core';
import { Plugin } from '@app/shared/models/plugin';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { merge } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { HeaderService } from './services/header-service';

const log = new Logger('App');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private translateService: TranslateService,
    private apiService: ApiService,
    private i18nService: I18nService,
    private headerService: HeaderService
  ) {}

  ngOnInit() {
    // Setup logger
    if (environment.production) {
      Logger.enableProductionMode();
    }

    log.debug('init');

    this.apiService.getCasiaDevices().subscribe(devices => {
      if (devices.length > 0) {
        this.headerService.setShowManufacturer(true);
      }
    });

    // Setup translations
    this.i18nService.init(environment.defaultLanguage, environment.supportedLanguages);
    this.apiService.getPlugin().subscribe(plugin => {
      sessionStorage.setItem('plugin', JSON.stringify(plugin));
      this.titleService.setTitle(plugin?.Name.concat(' - ').concat(this.translateService.instant('dashboard')));
      this.setTitle();
    });
  }

  ngOnDestroy() {
    this.i18nService.destroy();
  }

  private setTitle() {
    const onNavigationEnd = this.router.events.pipe(filter(event => event instanceof NavigationEnd));

    // Change page title on navigation or language change, based on route data
    merge(this.translateService.onLangChange, onNavigationEnd)
      .pipe(
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter(route => route.outlet === 'primary'),
        mergeMap(route => route.data),
        untilDestroyed(this)
      )
      .subscribe(event => {
        const title = event['title'];
        if (title) {
          const plugin: Plugin = JSON.parse(sessionStorage.getItem('plugin'));
          this.titleService.setTitle(plugin?.Name.concat(' - ').concat(this.translateService.instant(title)));
        }
      });
  }
}
