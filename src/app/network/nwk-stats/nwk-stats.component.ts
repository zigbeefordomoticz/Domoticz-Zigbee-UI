import { KeyValue } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { Plugin } from '@app/shared/models/plugin';
import { Observable, Subject } from 'rxjs';
import { sortDesc } from '../../shared/fonction';

@Component({
  selector: 'app-nwk-stats',
  templateUrl: './nwk-stats.component.html',
  styleUrls: ['./nwk-stats.component.scss']
})
export class NwkStatsComponent implements OnInit {
  stats$: Observable<Array<string>>;
  listSubject$ = new Subject();
  timeStamp: string;
  plugin: Plugin;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.stats$ = this.apiService.getNwkStats();
    setTimeout(() => {
      this.plugin = JSON.parse(sessionStorage.getItem('plugin'));
    }, 500);
  }

  sortDesc(a: KeyValue<string, any>, b: KeyValue<string, any>) {
    return sortDesc(a, b);
  }

  nwkStatByDate(timeStamp: string) {
    this.timeStamp = timeStamp;
  }

  deleteNwkStatByDate(timeStamp: string) {
    this.apiService.deleteNwkStatsByTimeStamp(timeStamp).subscribe(() => {
      this.stats$ = this.apiService.getNwkStats();
      this.cdr.detectChanges();
    });
  }
}
