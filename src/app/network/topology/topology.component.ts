import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Observable } from 'rxjs';
import { sortDesc } from '@app/shared/fonction';
import { KeyValue } from '@angular/common';

const log = new Logger('TopologyComponent');

@Component({
  selector: 'app-topology',
  templateUrl: './topology.component.html',
  styleUrls: ['./topology.component.scss']
})
export class TopologyComponent implements OnInit {
  @Output() timeStamp = new EventEmitter();
  topologies$: Observable<Array<string>>;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.topologies$ = this.apiService.getTopologie();
  }

  sortDesc(a: KeyValue<string, any>, b: KeyValue<string, any>) {
    return sortDesc(a, b);
  }

  topologyByDate(timeStamp: string) {
    this.timeStamp.emit(timeStamp);
  }

  deleteTopologyByDate(timeStamp: string) {
    this.apiService.deleteTopologieByTimeStamp(timeStamp).subscribe(result => {
      this.topologies$ = this.apiService.getTopologie();
      this.cdr.detectChanges();
    });
  }
}
