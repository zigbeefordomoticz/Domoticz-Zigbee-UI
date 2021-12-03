import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Setting, Settings } from '@app/shared/models/setting';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('SwitchChannelComponent');

@Component({
  selector: 'app-switch-channel',
  templateUrl: './switch-channel.component.html',
  styleUrls: ['./switch-channel.component.scss']
})
export class SwitchChannelComponent implements OnInit {
  settings: Array<Settings>;
  channel: Setting;
  list: { label: string; value: any }[] = [];
  selectedChannel: number;

  constructor(private toastr: ToastrService, private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.apiService.getSettings().subscribe(res => {
      this.settings = res;
      const zigateConf = this.settings.find(settings => settings._Theme === 'ZigateConfiguration');
      this.channel = zigateConf.ListOfSettings.find(setting => setting.Name === 'channel');
      this.selectedChannel = this.channel.current_value;
      this.channel.list.forEach(v => {
        const key = Object.keys(v)[0];
        const valeur = Object.values(v)[0];
        this.list.push({ label: key, value: valeur });
      });
    });
  }

  compareNumeric(a: any, b: string): boolean {
    if (isNaN(a.value)) {
      return a.value === b;
    } else {
      return a.value === Number(b);
    }
  }

  switchChannel(event: any) {
    this.apiService.putChangeChannel(this.selectedChannel).subscribe(() => {
      this.toastr.success(this.translate.instant('admin.switchchannel.notify'));
    });
  }
}
