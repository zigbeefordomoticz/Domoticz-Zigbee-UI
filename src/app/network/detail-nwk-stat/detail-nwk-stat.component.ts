import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { Device } from '@app/shared/models/device';
import { Plugin } from '@app/shared/models/plugin';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { Observable } from 'rxjs';
import { NwkStat } from '../../shared/models/nwk';

const log = new Logger('DetailTopologyComponent');

@Component({
  selector: 'app-detail-nwk-stat',
  templateUrl: './detail-nwk-stat.component.html',
  styleUrls: ['./detail-nwk-stat.component.scss']
})
export class DetailNwkStatComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnChanges {
  @Input() timeStamp: string;
  chart: Chart;
  chart2: Chart;
  devices$: Observable<Array<Device>>;
  totalTx: number;
  totalFail: number;
  plugin: Plugin;

  constructor(private apiService: ApiService, private translate: TranslateService) {
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

  // createChart(data: any) {
  //   const series: Array<any> = [];

  //   Object.keys(data).forEach(key => {
  //     if (key === 'Total Tx') {
  //       this.totalTx = data[key];
  //     } else if (key === 'Total failures') {
  //       this.totalFail = data[key];
  //     } else {
  //       series.push({ name: key, y: data[key] });
  //     }
  //   });
  //   const chart = new Chart({
  //     chart: {
  //       type: 'column',
  //       height: '80%'
  //       // width: 16 * 2 * 25
  //     },
  //     title: {
  //       text: this.translate.instant('network.stats.detail.visu.chart.title')
  //     },
  //     xAxis: {
  //       type: 'category'
  //     },
  //     yAxis: {
  //       title: {
  //         text: this.translate.instant('network.stats.detail.visu.chart.y-axis')
  //       }
  //     },
  //     credits: {
  //       enabled: false
  //     },

  //     series: [
  //       {
  //         type: undefined,
  //         name: this.translate.instant('network.stats.detail.visu.chart.x-axis'),
  //         colorByPoint: true,
  //         data: series
  //         // pointWidth: 25
  //       }
  //     ]
  //   });
  //   this.chart = chart;

  //   chart.ref$.subscribe();
  // }

  createChart(data: Array<NwkStat>): void {
    const tab: Array<any> = [];
    // const tab2: Array<any> = [];
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
      // tab2.push({
      //   name: nwk.ZDeviceName ? nwk.ZDeviceName : nwk._NwkId,
      //   y: 0
      // });
    });

    totals.forEach(x => {
      x = x / data.length;
      x = Number(x).toFixed(2);
      averages.push(Number(x));
    });

    // let i = 0;
    // tab2.forEach(pie => {
    //   pie.y = totals[i];
    //   pie.color = Highcharts.getOptions().colors[i];
    //   i++;
    // });

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
    // series.push({
    //   type: 'pie',
    //   name: 'Total consumption',
    //   data: tab2,
    //   center: [100, 80],
    //   size: 100,
    //   showInLegend: false,
    //   dataLabels: {
    //     enabled: false
    //   }
    // });

    const chart = new Chart({
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
      // labels: {
      //   items: [
      //     {
      //       html: 'Total fruit consumption',
      //       style: {
      //         left: '50px',
      //         top: '18px'
      //         //              color: (Highcharts.theme && Highcharts.theme.textColor) || 'black'
      //       }
      //     }
      //   ]
      // },
      credits: {
        enabled: false
      },
      series: series
      // series: [
      //   {
      //     type: undefined,
      //     name: this.translate.instant('network.stats.detail.visu.chart.x-axis'),
      //     colorByPoint: true,
      //     data: series
      //   }
      // ]
    });
    this.chart = chart;

    this.subs.add(chart.ref$.subscribe());
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

    const chart = new Chart({
      chart: {
        height: '90%',
        polar: true,
        type: 'line'
      },
      pane: {
        //       size: '150%',
      },
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
    });
    this.chart2 = chart;

    this.subs.add(chart.ref$.subscribe());
  }
}
// const series1: any = [
//   {
//     name: 'Jane',
//     data: [3, 2, 1, 3, 4]
//   },
//   {
//     name: 'John',
//     data: [2, 3, 5, 7, 6]
//   },
//   {
//     name: 'Joe',
//     data: [4, 3, 3, 9, 0]
//   },
//   {
//     name: 'Average',
//     data: [3, 2.67, 3, 6.33, 3.33],
//     type: 'spline',
//     marker: {
//       lineWidth: 2,
//       lineColor: Highcharts.getOptions().colors[3],
//       fillColor: 'white'
//     }
//   },
//   {
//     type: 'pie',
//     name: 'Total consumption',
//     data: [
//       {
//         name: 'Jane',
//         y: 13,
//         color: Highcharts.getOptions().colors[0] // Jane's color
//       },
//       {
//         name: 'John',
//         y: 23,
//         color: Highcharts.getOptions().colors[1] // John's color
//       },
//       {
//         name: 'Joe',
//         y: 19,
//         color: Highcharts.getOptions().colors[2] // Joe's color
//       }
//     ],
//     center: [100, 80],
//     size: 100,
//     showInLegend: false,
//     dataLabels: {
//       enabled: false
//     }
//   }
// ];
