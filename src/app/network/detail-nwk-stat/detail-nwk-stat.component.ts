import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Device } from '@app/shared/models/device';
import { Chart } from 'angular-highcharts';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

const log = new Logger('DetailTopologyComponent');

@Component({
  selector: 'app-detail-nwk-stat',
  templateUrl: './detail-nwk-stat.component.html',
  styleUrls: ['./detail-nwk-stat.component.scss']
})
export class DetailNwkStatComponent implements OnInit, OnChanges {
  @Input() timeStamp: string;
  chart: Chart;
  devices$: Observable<Array<Device>>;
  totalTx: number;
  totalFail: number;

  constructor(private apiService: ApiService, private translate: TranslateService) {}

  ngOnInit() {
    this.devices$ = this.apiService.getDevices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeStamp.currentValue !== changes.timeStamp.previousValue) {
      this.apiService.getNwkStatsByTimeStamp(this.timeStamp).subscribe(result => {
        this.createChart(result);
      });
    }
  }

  createChart(data: any) {
    const series: Array<any> = [];

    Object.keys(data).forEach(key => {
      if (key === 'Total Tx') {
        this.totalTx = data[key];
      } else if (key === 'Total failures') {
        this.totalFail = data[key];
      } else {
        series.push({ name: key, y: data[key] });
      }
    });
    const chart = new Chart({
      chart: {
        type: 'column',
        height: '80%'
        // width: 16 * 2 * 25
      },
      title: {
        text: this.translate.instant('network.stats.detail.visu.chart.title')
      },
      xAxis: {
        type: 'category'
      },
      yAxis: {
        title: {
          text: this.translate.instant('network.stats.detail.visu.chart.y-axis')
        }
      },
      credits: {
        enabled: false
      },

      series: [
        {
          type: undefined,
          name: this.translate.instant('network.stats.detail.visu.chart.x-axis'),
          colorByPoint: true,
          data: series
          // pointWidth: 25
        }
      ]
    });
    this.chart = chart;

    chart.ref$.subscribe();
  }
}
