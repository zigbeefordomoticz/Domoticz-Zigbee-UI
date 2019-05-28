import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '@app/services/api.service';
import { Observable } from 'rxjs';
import { Plugin } from './plugin/plugin';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  json: Object | undefined = null;
  isLoading = false;

  constructor(private apiService: ApiService, private formBuilder: FormBuilder) {}

  ngOnInit() {}

  onClick(device: string) {
    let service;
    if (device === 'devices') {
      service = this.apiService.getDevices();
    }
    if (device === 'zdevices') {
      service = this.apiService.getZDevices();
    }
    if (device === 'zgroups') {
      service = this.apiService.getZGroups();
    }

    service
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((json: Object) => {
        this.json = json;
      });
  }
}
