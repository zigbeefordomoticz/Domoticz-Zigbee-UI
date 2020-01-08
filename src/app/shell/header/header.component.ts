import { Component, OnInit } from '@angular/core';
import { I18nService } from '@app/core';
import { HeaderService } from '@app/services/header-service';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../services/api.service';
import { TranslateService } from '@ngx-translate/core';

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

  constructor(
    private headerService: HeaderService,
    private toastr: ToastrService,
    private i18nService: I18nService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.headerService.restart.subscribe(restart => {
      this.restart = restart;
    });

    this.apiService.getPermitToJoin().subscribe(result => {
      this.permitToJoin = result;
      if (result.PermitToJoin !== 0) {
        this.permitChecked = true;
      }
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
  }

  get currentLanguage(): string {
    return this.i18nService.language;
  }

  get languages(): string[] {
    return this.i18nService.supportedLanguages;
  }
}
