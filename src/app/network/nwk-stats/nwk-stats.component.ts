import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { Observable, Subject } from 'rxjs';
import { Logger } from '@app/core';
import { PluginStats } from '@app/shared/models/plugin-stats';

const log = new Logger('NwkStatsComponent');

@Component({
  selector: 'app-nwk-stats',
  templateUrl: './nwk-stats.component.html',
  styleUrls: ['./nwk-stats.component.scss']
})
export class NwkStatsComponent implements OnInit {
  stats$: Observable<Array<string>>;
  listSubject$ = new Subject();
  @Output() timeStamp = new EventEmitter();

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.stats$ = this.apiService.getNwkStats();
  }

  nwkStatByDate(timeStamp: string) {
    this.timeStamp.emit(timeStamp);
  }

  deleteNwkStatByDate(timeStamp: string) {
    this.apiService.deleteNwkStatsByTimeStamp(timeStamp).subscribe(result => {
      this.stats$ = this.apiService.getNwkStats();
      this.cdr.detectChanges();
    });
  }
}
