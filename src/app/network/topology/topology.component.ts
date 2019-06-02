import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Observable } from 'rxjs';
import { PluginStats } from '@app/shared/models/plugin-stats';

const log = new Logger('TopologyComponent');

@Component({
  selector: 'app-topology',
  templateUrl: './topology.component.html',
  styleUrls: ['./topology.component.scss']
})
export class TopologyComponent implements OnInit {
  @Output() timeStamp = new EventEmitter();
  topologies$: Observable<PluginStats>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.topologies$ = this.apiService.getTopologie();
  }

  topologyByDate(timeStamp: string) {
    this.timeStamp.emit(timeStamp);
  }

  deleteTopologyByDate(timeStamp: string) {
    this.apiService.deleteTopologieByTimeStamp(timeStamp).subscribe();
  }
}
