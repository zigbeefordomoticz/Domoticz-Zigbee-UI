import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { Observable } from 'rxjs';
import { Logger } from '@app/core';

const log = new Logger('ZigateComponent');

@Component({
  selector: 'app-zigate',
  templateUrl: './zigate.component.html',
  styleUrls: ['./zigate.component.scss'],
})
export class ZigateComponent implements OnInit {
  zigate$: Observable<any>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.zigate$ = this.apiService.getZigate();
  }
}
