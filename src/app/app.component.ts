import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { I18nService, Logger, untilDestroyed } from '@app/core';
import { Plugin } from '@app/shared/models/plugin';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { NgxMousetrapService } from 'ngx-mousetrap';
import { merge, Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { ApiService } from './services/api.service';
import { HeaderService } from './services/header-service';
import { UnsubscribeOnDestroyAdapter } from './shared/adapter/unsubscribe-adapter';
import { NgcCookieConsentService, NgcStatusChangeEvent } from 'ngx-cookieconsent';
import { MatomoTracker } from '@ngx-matomo/tracker';

const log = new Logger('App');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnDestroy {
  keysBoundActive = environment.keysBoundActive;
  keysBoundInactive = environment.keysBoundInactive;
  activateRefresh = false;

  //keep refs to subscriptions to be able to unsubscribe later
  private statusChangeSubscription!: Subscription;
  private hasRememberedConsent!: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private translateService: TranslateService,
    private apiService: ApiService,
    private i18nService: I18nService,
    private headerService: HeaderService,
    private mouseTrapService: NgxMousetrapService,
    private ccService: NgcCookieConsentService,
    private readonly tracker: MatomoTracker
  ) {
    super();
    this.tracker.requireConsent();
  }

  ngOnInit() {
    // Setup logger
    if (environment.production) {
      Logger.enableProductionMode();
    }

    log.debug('init');

    // Setup translations
    this.i18nService.init(environment.defaultLanguage, environment.supportedLanguages);

    this.translateService
      .get(['cookie.message', 'cookie.dismiss', 'cookie.allow', 'cookie.deny', 'cookie.link', 'cookie.policy'])
      .subscribe(data => {
        this.ccService.getConfig().content = this.ccService.getConfig().content || {};
        this.ccService.getConfig().content.message = data['cookie.message'];
        this.ccService.getConfig().content.dismiss = data['cookie.dismiss'];
        this.ccService.getConfig().content.allow = data['cookie.allow'];
        this.ccService.getConfig().content.deny = data['cookie.deny'];
        this.ccService.getConfig().content.link = data['cookie.link'];
        this.ccService.getConfig().content.policy = data['cookie.policy'];
        this.ccService.getConfig().content.href = environment.linkToConsent;
        this.ccService.destroy();
        this.ccService.init(this.ccService.getConfig());

        this.statusChangeSubscription = this.ccService.statusChange$.subscribe((event: NgcStatusChangeEvent) => {
          if (event.status === 'allow') {
            this.tracker.rememberConsentGiven();
            this.tracker.setConsentGiven();
          } else {
            this.tracker.optUserOut();
          }
        });

        this.tracker.hasRememberedConsent().then(consent => {
          if (consent) {
            this.tracker.setConsentGiven();
          }
        });
      });

    this.apiService.getCasiaDevices().subscribe(devices => {
      if (devices.length > 0) {
        this.headerService.setShowManufacturer(true);
      }
    });

    this.apiService.getPlugin().subscribe(plugin => {
      sessionStorage.setItem('plugin', JSON.stringify(plugin));
      this.titleService.setTitle(plugin?.Name.concat(' - ').concat(this.translateService.instant('dashboard')));
      this.setTitle();
    });

    this.subs.sink = this.mouseTrapService.register(this.keysBoundActive).subscribe(evt => {
      this.activateRefresh = !this.activateRefresh;
      this.headerService.setPolling(this.activateRefresh);
    });

    this.subs.add(
      this.mouseTrapService.register(this.keysBoundInactive).subscribe(evt => {
        this.activateRefresh = false;
        this.headerService.setPolling(false);
      })
    );
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

  ngOnDestroy() {
    this.i18nService.destroy();
    this.statusChangeSubscription.unsubscribe();
    this.hasRememberedConsent.unsubscribe();
  }
}
