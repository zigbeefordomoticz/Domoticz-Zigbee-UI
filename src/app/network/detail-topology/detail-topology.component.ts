import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Device } from '@app/shared/models/device';
import { Chart } from 'angular-highcharts';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('DetailTopologyComponent');

@Component({
  selector: 'app-detail-topology',
  templateUrl: './detail-topology.component.html',
  styleUrls: ['./detail-topology.component.scss']
})
export class DetailTopologyComponent implements OnInit, OnChanges {
  @Input() timeStamp: string;
  chart1: Chart;
  chart2: Chart;
  devices$: Observable<Array<Device>>;

  constructor(private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.devices$ = this.apiService.getDevices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeStamp.currentValue !== changes.timeStamp.previousValue) {
      this.apiService.getTopologieByTimeStamp(this.timeStamp).subscribe(result => {
        this.createChart1(result);
        this.createChart2(result);
      });
    }
  }

  createChart1(data: Array<Object>) {
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
        text: this.translate.instant('network.topo.device.visu.chart.title')
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
    this.chart1 = chart;

    chart.ref$.subscribe();
  }

  createChart2(data: Array<Object>) {
    const series = data.map(element => {
      const tab = Object.values(element);
      tab.splice(1, 1);
      return tab;
    });
    log.debug(series);

    const chart = new Chart({
      chart: {
        type: 'networkgraph',
        height: '100%'
      },
      title: {
        text: this.translate.instant('network.topo.device.visu.chart.title')
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        networkgraph: {
          keys: ['from', 'to', 'weight'],
          layoutAlgorithm: {
            enableSimulation: true
          }
        }
      },
      series: [
        {
          type: undefined,
          keys: ['to', 'from', 'weight'],
          dataLabels: {
            enabled: true,
            linkFormat: ''
          },
          data: series
        }
      ]
    });
    this.chart2 = chart;

    chart.ref$.subscribe();
  }
}
