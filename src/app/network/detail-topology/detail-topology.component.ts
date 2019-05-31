import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Device } from '@app/shared/models/device';
import { Chart } from 'angular-highcharts';
import { Observable } from 'rxjs';

const log = new Logger('DetailTopologyComponent');

@Component({
  selector: 'app-detail-topology',
  templateUrl: './detail-topology.component.html',
  styleUrls: ['./detail-topology.component.scss']
})
export class DetailTopologyComponent implements OnInit, OnChanges {
  @Input() timeStamp: string;
  chart: Chart;
  devices$: Observable<Array<Device>>;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.devices$ = this.apiService.getDevices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeStamp.currentValue !== changes.timeStamp.previousValue) {
      this.apiService.getTopologieByTimeStamp(this.timeStamp).subscribe(result => {
        this.createChart(result);
      });
    }
  }

  createChart(data: Array<Object>) {
    const series = data.map(element => {
      const tab = Object.values(element);
      tab.splice(1, 1);
      return tab;
    });
    log.debug(series);

    const chart = new Chart({
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
