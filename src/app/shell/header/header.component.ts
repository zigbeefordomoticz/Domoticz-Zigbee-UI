import { Component, OnInit } from '@angular/core';
import { I18nService } from '@app/core';
import { HeaderService } from '@app/services/header-service';
import { Plugin } from '@app/shared/models/plugin';
import { Settings } from '@app/shared/models/setting';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, timer } from 'rxjs';
import { filter, map, retry, share, switchMap, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Setting } from '../../shared/models/setting';
import { UnsubscribeOnDestroyAdapter } from '../../shared/adapter/unsubscribe-adapter';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  menuHidden = true;
  permitToJoin: any;
  permitChecked = false;
  restart: boolean;
  showManufacturer: boolean;
  logError: boolean;
  settings: Array<Settings>;
  settingsToSave: Array<Setting> = [];
  plugin: Plugin;
  poll = false;

  constructor(
    private headerService: HeaderService,
    private toastr: ToastrService,
    private i18nService: I18nService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    setTimeout(() => {
      this.plugin = JSON.parse(sessionStorage.getItem('plugin'));
    }, 500);

    this.subs.add(
      this.headerService.restart.subscribe(restart => {
        this.restart = restart;
      })
    );

    this.subs.add(
      this.headerService.showManufacturer.subscribe(showManufacturer => {
        this.showManufacturer = showManufacturer;
      })
    );

    this.subs.add(
      this.headerService.logError.subscribe(logError => {
        this.logError = logError;
      })
    );

    this.subs.add(
      this.headerService.polling.subscribe(poll => {
        this.poll = poll;
        this.subs.add(
          timer(1, environment.refresh)
            .pipe(
              switchMap(() => this.getPermitToJoin()),
              retry(),
              share(),
              takeUntil(this.headerService.polling.pipe(filter(val => val === false)))
            )
            .subscribe()
        );
      })
    );

    if (!this.poll) {
      this.getPermitToJoin().subscribe();
    }

    this.apiService.getSettings().subscribe(res => {
      this.settings = res;
      this.settings.forEach(setting => {
        this.settingsToSave = this.settingsToSave.concat(setting.ListOfSettings);
      });
    });
  }

  permit(event: any) {
    if (event.currentTarget.checked) {
      this.permitToJoin.PermitToJoin = 255;
      this.apiService.putPermitToJoin(this.permitToJoin).subscribe((result: any) => {
        this.toastr.success(this.translate.instant('admin.permittojoin.on.notify'));
      });
    } else {
      this.permitToJoin.PermitToJoin = 0;
      this.apiService.putPermitToJoin(this.permitToJoin).subscribe((result: any) => {
        this.toastr.success(this.translate.instant('admin.permittojoin.off.notify'));
      });
    }
  }

  toggleMenu() {
    this.menuHidden = !this.menuHidden;
  }

  setLanguage(language: string) {
    this.i18nService.language = language;
    this.updateSettings(language);
  }

  get currentLanguage(): string {
    return this.i18nService.language;
  }

  get languages(): string[] {
    return this.i18nService.supportedLanguages;
  }

  updateSettings(language: string) {
    const settingsToSend: any = {};
    this.settingsToSave.forEach(setting => {
      const name = setting.Name;
      let value = setting.current_value;
      if (name === 'Lang') {
        value = language;
      }
      settingsToSend[name] = { current: value };
    });
    this.apiService.putSettings(settingsToSend).subscribe();
  }

  private getPermitToJoin(): Observable<any> {
    return this.apiService.getPermitToJoin().pipe(
      map(result => {
        this.permitToJoin = result;
        this.permitChecked = result.PermitToJoin !== 0;
      })
    );
  }
}
