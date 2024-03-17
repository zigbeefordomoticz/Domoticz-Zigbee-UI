import { KeyValue } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { sortDesc } from '@app/shared/fonction';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-topology',
  templateUrl: './topology.component.html',
  styleUrls: ['./topology.component.scss']
})
export class TopologyComponent implements OnInit {
  timeStamp: string;
  topologies$: Observable<Array<string>>;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.topologies$ = this.apiService.getTopologie();
  }

  sortDesc(a: KeyValue<string, any>, b: KeyValue<string, any>) {
    return sortDesc(a, b);
  }

  topologyByDate(timeStamp: string) {
    this.timeStamp = timeStamp;
  }

  deleteTopologyByDate(timeStamp: string) {
    this.apiService.deleteTopologieByTimeStamp(timeStamp).subscribe(() => {
      this.topologies$ = this.apiService.getTopologie();
      this.cdr.detectChanges();
    });
  }
}
