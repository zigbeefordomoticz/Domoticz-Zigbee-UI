import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';


@Component({
  selector: 'app-plugin-stats',
  templateUrl: './plugin-stats.component.html',
  styleUrls: ['./plugin-stats.component.scss']
})
export class PluginStatsComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  plugin: PluginStats;
  chart1: Chart;

  constructor(
    private apiService: ApiService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.apiService.getPluginStats().subscribe(res => {
      this.createChart1(res);
    });
  }

  createChart1(data: any) {
    const chart = new Chart({
      chart: {
        type: 'bar',
        height: '80%'
      },
      title: {
        text: 'Trafic'
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          stacking: 'normal'
        }
      },
      xAxis: {
        categories: ['Sent', 'Received', 'cluster']
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Messages'
        }
      },
      series: [
        { type: undefined, name: 'Sent', data: [data.Sent, 0, 0] },
        { type: undefined, name: 'Received', data: [0, data.Received, 0] },
        { type: undefined, name: 'Cluster', data: [0, 0, data.Cluster] }
      ]
    });
    this.chart1 = chart;

    this.subs.add(chart.ref$.subscribe());
  }
}
