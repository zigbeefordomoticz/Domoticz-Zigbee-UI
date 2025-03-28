import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { Device } from '@app/shared/models/device';
import { Plugin } from '@app/shared/models/plugin';
import { TranslateService } from '@ngx-translate/core';
import * as Highcharts from 'highcharts';
import { Observable } from 'rxjs';
import { NwkStat } from '../../shared/models/nwk';

@Component({
  selector: 'app-detail-nwk-stat',
  templateUrl: './detail-nwk-stat.component.html',
  styleUrls: ['./detail-nwk-stat.component.scss'],
  standalone: false
})
export class DetailNwkStatComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnChanges {
  @Input() timeStamp: string;
  Highcharts1: typeof Highcharts = Highcharts;
  chartOptions1: Highcharts.Options = {};
  Highcharts2: typeof Highcharts = Highcharts;
  chartOptions2: Highcharts.Options = {};
  devices$: Observable<Array<Device>>;
  totalTx: number;
  totalFail: number;
  plugin: Plugin;

  constructor(
    private apiService: ApiService,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.devices$ = this.apiService.getDevices();
    setTimeout(() => {
      this.plugin = JSON.parse(sessionStorage.getItem('plugin'));
    }, 500);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeStamp.currentValue !== changes.timeStamp.previousValue) {
      this.apiService.getNwkStatsByTimeStamp(this.timeStamp).subscribe(result => {
        this.createChart(result);
        this.createChart2(result);
      });
    }
  }

  createChart(data: Array<NwkStat>): void {
    const tab: Array<any> = [];
    const channels: Array<any> = [];
    const averages: Array<any> = [];
    const totals: Array<any> = [];

    data.forEach(nwk => {
      const tempChannels = nwk.Channels;
      tempChannels.sort((n1, n2) => Number(n1.Channel) - Number(n2.Channel));
      nwk.Channels = tempChannels;
    });

    data[0].Channels.forEach(channel => {
      channels.push(channel.Channel);
    });

    data.forEach(nwk => {
      const values: Array<any> = [];
      let i = 0;
      nwk.Channels.forEach(channel => {
        values.push(channel.Level);
        if (!totals[i]) {
          totals[i] = Number(channel.Level);
        } else {
          totals[i] = Number(totals[i]) + Number(channel.Level);
        }
        i++;
      });
      tab.push({
        name: nwk.ZDeviceName ? nwk.ZDeviceName : nwk._NwkId,
        data: values
      });
    });

    totals.forEach(x => {
      x = x / data.length;
      x = Number(x).toFixed(2);
      averages.push(Number(x));
    });

    const series: Array<any> = tab;
    series.push({
      name: 'Average',
      data: averages,
      type: 'spline',
      marker: {
        lineWidth: 2,
        lineColor: Highcharts.getOptions().colors[3],
        fillColor: 'white'
      }
    });

    this.chartOptions1 = {
      chart: {
        type: 'column',
        height: '20%'
        // width: 16 * 2 * 25
      },
      title: {
        text: this.translate.instant('network.stats.detail.visu.chart.title')
      },
      xAxis: {
        categories: channels
      },
      yAxis: {
        title: {
          text: this.translate.instant('network.stats.detail.visu.chart.y-axis')
        }
      },
      credits: {
        enabled: false
      },
      series: series
    };
  }

  createChart2(data: Array<NwkStat>) {
    const tab: Array<any> = [];
    const channels: Array<any> = [];

    data.forEach(nwk => {
      const tempChannels = nwk.Channels;
      tempChannels.sort((n1, n2) => Number(n1.Channel) - Number(n2.Channel));
      nwk.Channels = tempChannels;
    });

    data[0].Channels.forEach(channel => {
      channels.push(channel.Channel);
    });

    data.forEach(nwk => {
      const values: Array<any> = [];
      nwk.Channels.forEach(channel => {
        values.push(channel.Level);
      });
      tab.push({
        name: nwk.ZDeviceName ? nwk.ZDeviceName : nwk._NwkId,
        data: values,
        pointPlacement: 'on'
      });
    });

    this.chartOptions2 = {
      chart: {
        height: '90%',
        polar: true,
        type: 'line'
      },
      pane: {},
      title: {
        text: this.translate.instant('network.stats.detail.visu.chart.title')
      },
      xAxis: {
        categories: channels,
        tickmarkPlacement: 'on',
        lineWidth: 0
      },
      yAxis: {
        gridLineInterpolation: 'polygon',
        lineWidth: 0,
        min: 0
      },
      tooltip: {
        shared: true,
        pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y:,.0f}</b><br/>'
      },
      legend: {
        align: 'left',
        verticalAlign: 'bottom'
      },
      credits: {
        enabled: false
      },
      series: tab,
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 600
            },
            chartOptions: {
              legend: {
                align: 'center',
                verticalAlign: 'bottom'
              },
              pane: {
                size: '80%'
              }
            }
          }
        ]
      }
    };
  }
}
