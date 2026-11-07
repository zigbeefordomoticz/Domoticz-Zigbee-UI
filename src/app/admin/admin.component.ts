import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '@app/services/api.service';
import { greenPowerSupported } from '@app/shared/models/plugin';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: false
})
export class AdminComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  action: string;
  // Pairing tab: Zigbee and Zigbee 3.0 devices, or Zigbee Green Power (?pairing=greenpower)
  pairing: string;
  // Null until /plugin answers: a ?pairing=greenpower link then waits instead of showing the Zigbee page first
  greenPowerSupported: boolean | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private apiService: ApiService
  ) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.activatedRoute.queryParamMap.subscribe(params => {
      // The Admin menu links here with ?action=plugin|pairing|group|coordinator; none opens Plugin
      this.action = params.get('action') || 'plugin';
      this.pairing = params.get('pairing') || 'zigbee';
    });
    this.subs.sink = this.apiService.getPlugin().subscribe({
      next: plugin => (this.greenPowerSupported = greenPowerSupported(plugin)),
      error: () => (this.greenPowerSupported = false)
    });
  }
}
