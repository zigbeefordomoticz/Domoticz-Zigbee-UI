import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { Chameleon } from '@app/shared/models/chameleon';
import { Gamma, ParameterForDisplay } from '@app/shared/models/gamma';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-manufacturer-chameleon',
  templateUrl: './chameleon.component.html',
  styleUrls: ['./chameleon.component.scss']
})
export class ChameleonComponent implements OnInit {
  chameleon$: Observable<Chameleon[]>;
  deviceSelected: Chameleon;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.chameleon$ = this.apiService.getChameleonTicmeter().pipe(
      map(chameleons => {
        chameleons.forEach(chameleon => {
          chameleon.ParametersForDisplay = [];
          chameleon.Parameters.forEach(param => {
            const parameter = new ParameterForDisplay();
            parameter.key = Object.keys(param)[0];
            parameter.value = Object.values(param)[0] as string;
            chameleon.ParametersForDisplay.push(parameter);
          });
        });
        return chameleons;
      })
    );
  }

  getConfiguration(event: Chameleon): void {
    this.deviceSelected = event;
  }
}
