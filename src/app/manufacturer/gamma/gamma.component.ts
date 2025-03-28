import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { Gamma, ParameterForDisplay } from '@app/shared/models/gamma';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-manufacturer-gamma',
  templateUrl: './gamma.component.html',
  styleUrls: ['./gamma.component.scss']
})
export class GammaComponent implements OnInit {
  gammas$: Observable<Gamma[]>;
  deviceSelected: Gamma;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.gammas$ = this.apiService.getGammaTroniqueTicmeter().pipe(
      map(gammas => {
        gammas.forEach(gamma => {
          gamma.ParametersForDisplay = [];
          gamma.Parameters.forEach(param => {
            const parameter = new ParameterForDisplay();
            parameter.key = Object.keys(param)[0];
            parameter.value = Object.values(param)[0] as string;
            gamma.ParametersForDisplay.push(parameter);
          });
        });
        return gammas;
      })
    );
  }

  getConfiguration(event: Gamma): void {
    this.deviceSelected = event;
  }
}
