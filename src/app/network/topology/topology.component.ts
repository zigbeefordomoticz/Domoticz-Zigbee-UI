import { Component, OnInit } from '@angular/core';
import { PluginStats } from '@app/dashboard/plugin-stats/plugin-stats';
import { ApiService } from '@app/services/api.service';
import { Observable } from 'rxjs';
import { Logger } from '@app/core';
import { Chart } from 'angular-highcharts';
import { map } from 'rxjs/operators';
import { Device } from '@app/shared/models/device';

const log = new Logger('TopologyComponent');

@Component({
  selector: 'app-topology',
  templateUrl: './topology.component.html',
  styleUrls: ['./topology.component.scss']
})
export class TopologyComponent implements OnInit {
  topologies$: Observable<PluginStats>;
  topologie$: Observable<PluginStats>;
  chart: Chart;
  devices$: Observable<Array<Device>>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.topologies$ = this.apiService.getTopologie();
    this.devices$ = this.apiService.getDevices();
  }

  topologyByDate(timeStamp: string) {
    log.debug(timeStamp);
    this.apiService.getTopologieByTimeStamp(timeStamp).subscribe(result => {
      this.createChart(result);
    });
  }

  createChart(data: Array<Object>) {
    const series = data.map(element => {
      let tab = Object.values(element);
      tab.splice(1, 1);
      return tab;
    });
    log.debug(series);

    let chart = new Chart({
      chart: {
        type: 'dependencywheel'
      },
      title: {
        text: 'TEST'
      },
      credits: {
        enabled: false
      },
      series: [
        {
          type: undefined,
          keys: ['to', 'from', 'weight'],
          data: series
        }
      ]
    });
    this.chart = chart;

    chart.ref$.subscribe(console.log);
  }
}
