import { Component, OnInit } from '@angular/core';
import { I18nService } from '@app/core';
import { HeaderService } from '@app/services/header-service';
import { Plugin } from '@app/shared/models/plugin';
import { Settings } from '@app/shared/models/setting';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Setting } from '../../shared/models/setting';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  menuHidden = true;
  permitToJoin: any;
  permitChecked = false;
  restart: boolean;
  settings: Array<Settings>;
  settingsToSave: Array<Setting> = [];
  plugin: Plugin;

  constructor(
    private headerService: HeaderService,
    private toastr: ToastrService,
    private i18nService: I18nService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.plugin = JSON.parse(sessionStorage.getItem('plugin'));
    }, 500);

    this.headerService.restart.subscribe(restart => {
      this.restart = restart;
    });

    this.apiService.getPermitToJoin().subscribe(result => {
      this.permitToJoin = result;
      if (result.PermitToJoin !== 0) {
        this.permitChecked = true;
      }
    });
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
        this.toastr.success(this.translate.instant('api.global.succes.update.title'));
      });
    } else {
      this.permitToJoin.PermitToJoin = 0;
      this.apiService.putPermitToJoin(this.permitToJoin).subscribe((result: any) => {
        this.toastr.success(this.translate.instant('api.global.succes.update.title'));
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
}
