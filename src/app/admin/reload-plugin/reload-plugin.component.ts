import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { NotifyService } from '@app/services/notify.service';
import { TranslateService } from '@ngx-translate/core';
import { Plugin } from '@app/shared/models/plugin';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

const log = new Logger('ReloadPluginComponent');

@Component({
  selector: 'app-reload-plugin',
  templateUrl: './reload-plugin.component.html',
  styleUrls: ['./reload-plugin.component.scss']
})
export class ReloadPluginComponent implements OnInit {
  permitToJoin: any;
  plugin: Plugin;
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private notifyService: NotifyService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group({
      port: [localStorage.getItem('domoticz_port'), Validators.required],
      host: [localStorage.getItem('domoticz_host'), Validators.required],
      username: [localStorage.getItem('domoticz_username'), Validators.required],
      password: [localStorage.getItem('domoticz_password'), Validators.required],
      protocol: [localStorage.getItem('domoticz_protocol'), Validators.required]
    });
    this.apiService.getPlugin().subscribe(result => (this.plugin = result));
  }

  reloadPlugin(event: any) {
    localStorage.setItem('domoticz_port', this.form.get('port').value);
    localStorage.setItem('domoticz_host', this.form.get('host').value);
    localStorage.setItem('domoticz_username', btoa(this.form.get('username').value));
    localStorage.setItem('domoticz_password', btoa(this.form.get('password').value));
    localStorage.setItem('domoticz_protocol', this.form.get('protocol').value);

    this.plugin.DomoticzPort = this.form.get('port').value;
    this.plugin.DomoticzHost = this.form.get('host').value;
    this.plugin.DomoticzUsername = this.form.get('username').value;
    this.plugin.DomoticzPassword = this.form.get('password').value;
    this.plugin.DomoticzProtocol = this.form.get('protocol').value;

    this.apiService.getReloadPlugin(this.plugin).subscribe((result: any) => {
      this.notifyService.notify('Plugin restarted');
    });
  }
}
