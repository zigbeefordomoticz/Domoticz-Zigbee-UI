import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { Device } from '@app/shared/models/device';
import { Chart } from 'angular-highcharts';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import * as Highcharts from 'highcharts';

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

    chart.ref$.subscribe();
  }

  createChart2(data: Array<Object>) {
    // tslint:disable-next-line: max-line-length
    // data = [
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Volet Cuisine', _lnkqty: 254 },
    //   { Child: 'Volet Philippe', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 254 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 144 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 251 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 250 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 255 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 60 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 253 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 249 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 255 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'Volet Cuisine', _lnkqty: 255 },
    //   { Child: 'Volet Cuisine', DeviceType: 'End Device', Father: 'Hue Motion', _lnkqty: 255 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Volet Salon', _lnkqty: 254 },
    //   { Child: 'Volet Philippe', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 252 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 255 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 254 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 251 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 252 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 255 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 254 },
    //   { Child: 'Volet Cuisine', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 234 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 255 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 254 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 255 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'Volet Salon', _lnkqty: 253 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Lampe Entree', _lnkqty: 252 },
    //   { Child: 'Volet Philippe', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 49 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 52 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 140 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 95 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 41 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 124 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 139 },
    //   { Child: 'Volet Cuisine', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 28 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 65 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 71 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'Lampe Entree', _lnkqty: 74 },
    //   { Child: 'Lampe Entree', DeviceType: 'End Device', Father: 'c268', _lnkqty: 255 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Lampe Salon', _lnkqty: 230 },
    //   { Child: 'Volet Philippe', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 52 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 107 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 76 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 128 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 71 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 128 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 53 },
    //   { Child: 'Volet Cuisine', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 66 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 77 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 84 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 131 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'Lampe Salon', _lnkqty: 62 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Volet Salle a Manger', _lnkqty: 254 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 253 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 254 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 254 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 251 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 255 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 253 },
    //   { Child: 'Volet Cuisine', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 251 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 207 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 254 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'Volet Salle a Manger', _lnkqty: 251 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'End Device', Father: '7dc7', _lnkqty: 255 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 111 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 4 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 247 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 204 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 164 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 71 },
    //   { Child: 'Volet Philippe', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 47 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 140 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'ef3d', _lnkqty: 159 },
    //   { Child: 'Volet Cuisine', DeviceType: 'Router', Father: 'ef3d', _lnkqty: 4 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'fc80', _lnkqty: 254 },
    //   { Child: 'Volet Philippe', DeviceType: 'Router', Father: 'fc80', _lnkqty: 255 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'fc80', _lnkqty: 237 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'fc80', _lnkqty: 252 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'fc80', _lnkqty: 254 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'Router', Father: 'fc80', _lnkqty: 241 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'fc80', _lnkqty: 248 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'fc80', _lnkqty: 255 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'fc80', _lnkqty: 39 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'fc80', _lnkqty: 253 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'fc80', _lnkqty: 249 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'fc80', _lnkqty: 255 },
    //   { Child: 'fc80', DeviceType: 'End Device', Father: '2ba2', _lnkqty: 255 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Prise Info Bureau', _lnkqty: 254 },
    //   { Child: 'Volet Philippe', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 252 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 255 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 253 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 254 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 249 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 255 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 255 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 132 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 255 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 254 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'Prise Info Bureau', _lnkqty: 247 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'End Device', Father: '1cde', _lnkqty: 255 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Volet Chambre Parent', _lnkqty: 254 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 255 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 255 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 255 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 249 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 254 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 254 },
    //   { Child: 'Volet Cuisine', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 35 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 254 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 254 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 254 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'Volet Chambre Parent', _lnkqty: 205 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'End Device', Father: '3933', _lnkqty: 255 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Volet Philippe', _lnkqty: 254 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 253 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 253 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 239 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 255 },
    //   { Child: 'Volet Bureau', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 254 },
    //   { Child: 'Volet Cuisine', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 254 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 255 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 255 },
    //   { Child: 'fc80', DeviceType: 'Router', Father: 'Volet Philippe', _lnkqty: 255 },
    //   { Child: 'Volet Philippe', DeviceType: 'End Device', Father: 'BT Nico', _lnkqty: 255 },
    //   { Child: 'Volet Philippe', DeviceType: 'End Device', Father: '2aec', _lnkqty: 255 },
    //   { Child: 'Zigate', DeviceType: 'Coordinator', Father: 'Volet Bureau', _lnkqty: 254 },
    //   { Child: 'Volet Philippe', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 253 },
    //   { Child: 'Volet Chambre Parent', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 255 },
    //   { Child: 'Volet Salon', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 253 },
    //   { Child: 'Led Tele', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 254 },
    //   { Child: 'Prise Info Bureau', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 255 },
    //   { Child: 'Lampe Salle a Manger', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 251 },
    //   { Child: 'Lampe Salon', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 254 },
    //   { Child: 'Volet Cuisine', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 11 },
    //   { Child: 'Volet Salle a Manger', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 254 },
    //   { Child: 'ef3d', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 255 },
    //   { Child: 'Lampe Entree', DeviceType: 'Router', Father: 'Volet Bureau', _lnkqty: 78 },
    //   { Child: 'Zigate', DeviceType: 'End Device', Father: '75c9', _lnkqty: 101 },
    //   { Child: 'Zigate', DeviceType: 'End Device', Father: 'THB Cuisine', _lnkqty: 129 },
    //   { Child: 'Zigate', DeviceType: 'End Device', Father: 'THB Salon', _lnkqty: 143 },
    //   { Child: 'Zigate', DeviceType: 'End Device', Father: 'XCube Salon', _lnkqty: 144 }
    // ];

    const datas = data.map(element => {
      const tab = Object.values(element);
      tab.splice(1, 1);
      return tab;
    });

    log.debug('ben', datas);

    // const datas = [];
    // datas.push(['Zigate', 'Ruban Salon', 252]);
    // datas.push(['Ruban Salon', 'Lampe Cuisine', 0]);
    // datas.push(['Ruban Salon', 'Lampe Ainhoa', 0]);

    // datas.push(['Zigate', 'Ruban2 Salon', 252]);
    // datas.push(['Ruban2 Salon', 'Lampe Cuisine', 0]);
    // datas.push(['Ruban2 Salon', 'Lampe Ainhoa', 0]);

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
        }
      },
      series: series1
    });
    this.chart2 = chart;

    chart.ref$.subscribe();
  }

  test(series: any) {
    const colors = Highcharts.getOptions().colors;
    let i = 0;
    const nodes = {};
    series[0].data.forEach(function(link: any) {
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

    series[0].nodes = Object.keys(nodes).map(function(id: any) {
      return nodes[id];
    });
  }
}
