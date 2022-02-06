import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { Observable } from 'rxjs';
import { Logger } from '@app/core';

const log = new Logger('CoordinatorComponent');

@Component({
  selector: 'app-coordinator',
  templateUrl: './coordinator.component.html',
  styleUrls: ['./coordinator.component.scss']
})
export class CoordinatorComponent implements OnInit {
  coordinator$: Observable<any>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.coordinator$ = this.apiService.getCoordinator();
  }
}
