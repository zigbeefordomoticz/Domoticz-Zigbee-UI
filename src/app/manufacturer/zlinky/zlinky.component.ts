import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { ParameterForDisplay, Zlinky } from '@app/shared/models/zlinky';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-manufacturer-zlinky',
  templateUrl: './zlinky.component.html',
  styleUrls: ['./zlinky.component.scss']
})
export class ZlinkyComponent implements OnInit {
  zlinkys$: Observable<Zlinky[]>;
  deviceSelected: Zlinky;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.zlinkys$ = this.apiService.getZlinky().pipe(
      map(zlinkys => {
        zlinkys.forEach(zlinky => {
          zlinky.protocole = 'PROTOCOL_LINKY_' + zlinky['PROTOCOL Linky'];
          zlinky.ParametersForDisplay = [];
          zlinky.Parameters.forEach(param => {
            const parameter = new ParameterForDisplay();
            parameter.key = Object.keys(param)[0];
            parameter.value = Object.values(param)[0] as string;
            zlinky.ParametersForDisplay.push(parameter);
          });
        });
        return zlinkys;
      })
    );
  }

  getConfiguration(event: Zlinky): void {
    this.deviceSelected = event;
  }
}
