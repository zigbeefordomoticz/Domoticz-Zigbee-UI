import { Component, OnInit } from '@angular/core';

import { I18nService } from '@app/core';
import { ApiService } from '../../services/api.service';
import { NotifyService } from '@app/services/notify.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  menuHidden = true;
  permitToJoin: any;
  permitChecked = false;

  constructor(private notifyService: NotifyService, private i18nService: I18nService, private apiService: ApiService) {}

  ngOnInit() {
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
        this.notifyService.notify();
      });
    } else {
      this.permitToJoin.PermitToJoin = 0;
      this.apiService.putPermitToJoin(this.permitToJoin).subscribe((result: any) => {
        this.notifyService.notify();
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
