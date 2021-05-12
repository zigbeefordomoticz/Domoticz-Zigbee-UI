import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Observable, Subject } from 'rxjs';
import { sortDesc } from '../../shared/fonction';
import { KeyValue } from '@angular/common';

const log = new Logger('NwkStatsComponent');

@Component({
  selector: 'app-nwk-stats',
  templateUrl: './nwk-stats.component.html',
  styleUrls: ['./nwk-stats.component.scss'],
})
export class NwkStatsComponent implements OnInit {
  stats$: Observable<Array<string>>;
  listSubject$ = new Subject();
  timeStamp: string;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.stats$ = this.apiService.getNwkStats();
  }

  sortDesc(a: KeyValue<string, any>, b: KeyValue<string, any>) {
    return sortDesc(a, b);
  }

  nwkStatByDate(timeStamp: string) {
    this.timeStamp = timeStamp;
  }

  deleteNwkStatByDate(timeStamp: string) {
    this.apiService.deleteNwkStatsByTimeStamp(timeStamp).subscribe((result) => {
      this.stats$ = this.apiService.getNwkStats();
      this.cdr.detectChanges();
    });
  }
}
