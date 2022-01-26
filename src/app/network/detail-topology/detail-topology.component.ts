import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { Device } from '@app/shared/models/device';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { Relation } from '@app/shared/models/relation';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';
import { Observable } from 'rxjs';

const log = new Logger('DetailTopologyComponent');

@Component({
  selector: 'app-detail-topology',
  templateUrl: './detail-topology.component.html',
  styleUrls: ['./detail-topology.component.scss']
})
export class DetailTopologyComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnChanges {
  @Input() timeStamp: string;
  chart1: Chart;
  chart2: Chart;
  devices$: Observable<Device[]>;
  form: FormGroup;
  datas: Relation[];
  devices: DeviceByName[];
  showDetail = false;
  device: DeviceByName;
  data: Relation;
  tos: any[];
  froms: any[];

  constructor(private apiService: ApiService, private translate: TranslateService, private formBuilder: FormBuilder) {
    super();
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      nodeToFilter: [null],
      detail: [null]
    });

    this.subs.sink = this.form.get('nodeToFilter').valueChanges.subscribe((value: string) => {
      this.createChart2(value);
    });

    this.subs.add(
      this.form.get('detail').valueChanges.subscribe(value => {
        const selectedPoint = this.chart2.ref.hoverPoint as any;
        this.froms = selectedPoint.linksFrom.map((point: any) => point.options);
        this.tos = selectedPoint.linksTo.map((point: any) => point.options);
        this.tos = this.tos.concat(this.froms);
      })
    );

    this.devices$ = this.apiService.getDevices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeStamp.currentValue !== changes.timeStamp.previousValue) {
      this.apiService.getTopologieByTimeStamp(this.timeStamp).subscribe(result => {
        this.datas = result;
        this.apiService.getZDeviceName().subscribe(result => {
          this.devices = result;
          const zigate = {
            IEEE: '',
            MacCapa: '',
            Model: '',
            Health: '',
            Status: '',
            WidgetList: [''],
            ZDeviceName: 'Zigate',
            _NwkId: ''
          };
          this.devices.unshift(zigate);
          this.createChart1();
          this.createChart2();
        });
      });
    }
  }

  createChart1() {
    const series = this.datas.map(element => {
      const tab = Object.values(element);
      tab.splice(1, 1);
      return tab;
    });

    const chart = new Chart({
      chart: {
        type: 'dependencywheel',
        height: '80%'
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
  }

  createChart2(nodeToFilter?: string) {
    let i = 0;
    let datas = this.datas.map(element => {
      const tab = Object.values(element);
      tab.splice(1, 1);
      return tab;
    });

    if (nodeToFilter) {
      datas = datas.filter(
        element =>
          element[0].toLowerCase() === nodeToFilter.toLowerCase() ||
          element[1].toLowerCase() === nodeToFilter.toLowerCase()
      );
    }

    const series1: any = [
      {
        nodes: undefined,
        type: undefined,
        keys: ['from', 'to', 'weight'],
        dataLabels: {
          enabled: true,
          linkFormat: ''
        },
        data: datas
      }
    ];

    this.test(series1);

    const chart = new Chart({
      chart: {
        type: 'networkgraph',
        height: '80%'
      },
      title: {
        text: this.translate.instant('network.topo.device.visu.network.chart.title')
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        networkgraph: {
          keys: ['from', 'to', 'weight'],
          layoutAlgorithm: {
            enableSimulation: true,
            integration: 'verlet'
          }
        },
        series: {
          point: {
            events: {
              click: function () {
                const el = document.getElementById('detail') as HTMLInputElement;
                el.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          }
        }
      },
      series: series1
    });
    this.chart2 = chart;
  }

  test(series: any) {
    const colors = Highcharts.getOptions().colors;
    let i = 0;
    const nodes = {};
    series[0].data.forEach(function (link: any) {
      if (link[1] !== 'Zigate') {
        if (link[0] === 'Zigate') {
          nodes['Zigate'] = {
            id: 'Zigate',
            marker: {
              radius: 20
            }
          };
          nodes[link[1]] = {
            id: link[1],
            marker: {
              radius: 10
            },
            color: colors[i++]
          };
        } else if (nodes[link[0]] && nodes[link[0]].color) {
          nodes[link[1]] = {
            id: link[1],
            color: nodes[link[0]].color
          };
        }
      }
    });

    series[0].nodes = Object.keys(nodes).map(function (id: any) {
      return nodes[id];
    });
  }
}
