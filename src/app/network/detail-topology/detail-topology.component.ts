import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { Relation } from '@app/shared/models/relation';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import * as Highcharts from 'highcharts';

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
  form: FormGroup;
  datas: Relation[];
  devices: DeviceByName[];
  showDetail = false;
  device: DeviceByName;
  data: Relation;
  relationsSelected: any[];

  constructor(private apiService: ApiService, private translate: TranslateService, private formBuilder: FormBuilder) {
    super();
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      nodeToFilter: [null],
      detail: [null]
    });

    this.apiService.getZDeviceName().subscribe(result => {
      //      this.devices = result;
      this.devices = this.zdevices;
      const coordinator = {
        IEEE: '',
        MacCapa: [''],
        Model: '',
        Health: '',
        Status: '',
        WidgetList: [''],
        ZDeviceName: 'Zigbee Controller',
        _NwkId: ''
      };
      this.devices.unshift(coordinator);
    });

    this.subs.sink = this.form.get('nodeToFilter').valueChanges.subscribe((value: string) => {
      this.createChart2(value);
    });

    this.subs.add(
      this.form.get('detail').valueChanges.subscribe(value => {
        const selectedPoint = this.chart2.ref.hoverPoint as any;
        let toSelected = selectedPoint.linksFrom.map((point: any) => point.options) as any[];
        toSelected.map(relation => {
          const to = this.devices.find(device => device.ZDeviceName === relation.to || device._NwkId === relation.to);
          relation.Model = to.Model;
          relation.Status = to.Status;
          relation.Health = to.Health;
          relation.Battery = to.Battery;
        });
        let fromSelected = selectedPoint.linksTo.map((point: any) => point.options) as any[];
        fromSelected.map(relation => {
          const from = this.devices.find(
            device => device.ZDeviceName === relation.from || device._NwkId === relation.from
          );
          relation.Model = from.Model;
          relation.Status = from.Status;
          relation.Health = from.Health;
          relation.Battery = from.Battery;
          relation.to = relation.from;
        });

        this.relationsSelected = toSelected.concat(fromSelected);
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.timeStamp.currentValue !== changes.timeStamp.previousValue) {
      this.apiService.getTopologieByTimeStamp(this.timeStamp).subscribe(result => {
        //        this.datas = result;
        this.datas = this.relationsPipiche;
        this.createChart1();
        this.createChart2();
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
        keys: ['to', 'from', 'weight'],
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
          keys: ['to', 'from', 'weight'],
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
      if (link[0] !== 'Zigbee Controller') {
        if (link[1] === 'Zigbee Controller') {
          nodes['Zigbee Controller'] = {
            id: 'Zigbee Controller',
            marker: {
              radius: 20
            }
          };
          nodes[link[0]] = {
            id: link[0],
            marker: {
              radius: 10
            },
            color: colors[i++]
          };
        } else if (nodes[link[1]] && nodes[link[1]].color) {
          nodes[link[0]] = {
            id: link[0],
            color: nodes[link[1]].color
          };
        }
      }
    });

    series[0].nodes = Object.keys(nodes).map(function (id: any) {
      return nodes[id];
    });
  }

  relationsPipiche = [
    {
      Child: 'IAS Sirene',
      DeviceType: 'Router',
      Father: 'Zigbee Controller',
      _lnkqty: 58
    },
    {
      Child: 'IAS Sirene',
      DeviceType: 'Router',
      Father: 'Led LKex',
      _lnkqty: 252
    },
    {
      Child: 'IAS Sirene',
      DeviceType: 'Router',
      Father: 'Led Ikea',
      _lnkqty: 241
    },
    {
      Child: 'OnOff Ikea',
      DeviceType: 'End Device',
      Father: 'IAS Sirene',
      _lnkqty: 255
    },
    {
      Child: 'Repeater',
      DeviceType: 'Coordinator',
      Father: 'Zigbee Controller',
      _lnkqty: 254
    },
    {
      Child: 'Repeater',
      DeviceType: 'Router',
      Father: 'Led LKex',
      _lnkqty: 196
    },
    {
      Child: 'Repeater',
      DeviceType: 'Router',
      Father: 'Led Ikea',
      _lnkqty: 254
    },
    {
      Child: 'Motion frient',
      DeviceType: 'End Device',
      Father: 'Repeater',
      _lnkqty: 168
    },
    {
      Child: 'Dim Ikea',
      DeviceType: 'End Device',
      Father: 'Repeater',
      _lnkqty: 89
    },
    {
      Child: 'Led LKex',
      DeviceType: 'Coordinator',
      Father: 'Zigbee Controller',
      _lnkqty: 254
    },
    {
      Child: 'Led LKex',
      DeviceType: 'Router',
      Father: 'Led Ikea',
      _lnkqty: 244
    },
    {
      Child: 'Lumi Door',
      DeviceType: 'End Device',
      Father: 'Led LKex',
      _lnkqty: 211
    },
    {
      Child: 'Wiser Thermostat',
      DeviceType: 'End Device',
      Father: 'Led LKex',
      _lnkqty: 223
    },
    {
      Child: 'Led Ikea',
      DeviceType: 'Coordinator',
      Father: 'Zigbee Controller',
      _lnkqty: 60
    },
    {
      Child: 'Led Ikea',
      DeviceType: 'Router',
      Father: 'Led LKex',
      _lnkqty: 101
    },
    {
      Child: 'Remote Tradfri',
      DeviceType: 'End Device',
      Father: 'Led Ikea',
      _lnkqty: 194
    },
    {
      Child: 'Inter Shutter Legrand',
      DeviceType: 'Router',
      Father: 'Led Ikea',
      _lnkqty: 133
    },
    {
      Child: 'Inter Shutter Legrand',
      DeviceType: 'Coordinator',
      Father: 'Zigbee Controller',
      _lnkqty: 241
    },
    {
      Child: 'Inter Shutter Legrand',
      DeviceType: 'Router',
      Father: 'Led LKex',
      _lnkqty: 164
    },
    {
      Child: 'Lumi Motion',
      DeviceType: 'End Device',
      Father: 'Inter Shutter Legrand',
      _lnkqty: 242
    },
    {
      Child: 'Inter Dimmer Legrand',
      DeviceType: 'Coordinator',
      Father: 'Zigbee Controller',
      _lnkqty: 254
    },
    {
      Child: 'Inter Dimmer Legrand',
      DeviceType: 'Router',
      Father: 'Led LKex',
      _lnkqty: 215
    },
    {
      Child: 'Inter Dimmer Legrand',
      DeviceType: 'Router',
      Father: 'Led Ikea',
      _lnkqty: 254
    },
    {
      Child: 'Micromodule Legrand',
      DeviceType: 'Coordinator',
      Father: 'Zigbee Controller',
      _lnkqty: 252
    },
    {
      Child: 'Micromodule Legrand',
      DeviceType: 'Router',
      Father: 'Led LKex',
      _lnkqty: 252
    },
    {
      Child: 'Micromodule Legrand',
      DeviceType: 'Router',
      Father: 'Led Ikea',
      _lnkqty: 252
    }
  ];

  zdevices = [
    {
      Battery: '',
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '90fd9ffffe86c7a1',
      LQI: 80,
      MacCapa: ['FFD', 'RxonIdle', 'MainPower'],
      Model: 'TRADFRI bulb E27 WS clear 950lm',
      Param:
        "{'PowerOnAfterOffOn': 255, 'fadingOff': 0, 'moveToHueSatu': 0, 'moveToColourTemp': 0, 'moveToColourRGB': 0, 'moveToLevel': 0}",
      Status: 'inDB',
      WidgetList: ['Zigbee - TRADFRI bulb E27 WS clear 950lm_ColorControlWW-90fd9ffffe86c7a1-01'],
      ZDeviceName: 'Led Ikea',
      _NwkId: 'ada7'
    },
    {
      Battery: '',
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '60a423fffe529d60',
      LQI: 80,
      MacCapa: ['FFD', 'RxonIdle', 'MainPower'],
      Model: 'LXEK-1',
      Param:
        "{'PowerOnAfterOffOn': 255, 'fadingOff': 0, 'moveToHueSatu': 0, 'moveToColourTemp': 0, 'moveToColourRGB': 0, 'moveToLevel': 0}",
      Status: 'inDB',
      WidgetList: ['Zigbee - LXEK-1_ColorControlRGBWW-60a423fffe529d60-01'],
      ZDeviceName: 'Led LKex',
      _NwkId: '7173'
    },
    {
      Battery: '',
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '680ae2fffe7aca89',
      LQI: 80,
      MacCapa: ['FFD', 'RxonIdle', 'MainPower'],
      Model: 'TRADFRI Signal Repeater',
      Param: '{}',
      Status: 'inDB',
      WidgetList: ['Zigbee - TRADFRI Signal Repeater_Voltage-680ae2fffe7aca89-01'],
      ZDeviceName: 'Repeater',
      _NwkId: 'a5ee'
    },
    {
      Battery: 16.0,
      ConsistencyCheck: 'ok',
      Health: 'Not seen last 24hours',
      IEEE: '90fd9ffffeea89e8',
      LQI: 25,
      MacCapa: ['RFD', 'Battery'],
      Model: 'TRADFRI remote control',
      Param: '{}',
      Status: 'inDB',
      WidgetList: ['Zigbee - TRADFRI remote control_Ikea_Round_5b-90fd9ffffeea89e8-01'],
      ZDeviceName: 'Remote Tradfri',
      _NwkId: 'cee1'
    },
    {
      Battery: 100,
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '000d6f0011087079',
      LQI: 116,
      MacCapa: ['FFD', 'RxonIdle', 'MainPower'],
      Model: 'WarningDevice',
      Param: '{}',
      Status: 'inDB',
      WidgetList: ['Zigbee - WarningDevice_AlarmWD-000d6f0011087079-01'],
      ZDeviceName: 'IAS Sirene',
      _NwkId: '2e33'
    },
    {
      Battery: 53,
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '54ef441000298533',
      LQI: 76,
      MacCapa: ['RFD', 'Battery'],
      Model: 'lumi.magnet.acn001',
      Param: '{}',
      Status: 'inDB',
      WidgetList: ['Zigbee - lumi.magnet.acn001_Door-54ef441000298533-01'],
      ZDeviceName: 'Lumi Door',
      _NwkId: 'bb45'
    },
    {
      Battery: '',
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '00047400008aff8b',
      LQI: 80,
      MacCapa: ['FFD', 'RxonIdle', 'MainPower'],
      Model: 'Shutter switch with neutral',
      Param: "{'netatmoInvertShutter': 0, 'netatmoLedShutter': 0}",
      Status: 'inDB',
      WidgetList: ['Zigbee - Shutter switch with neutral_Venetian-00047400008aff8b-01'],
      ZDeviceName: 'Inter Shutter Legrand',
      _NwkId: '06ab'
    },
    {
      Battery: '',
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '000474000082a54f',
      LQI: 18,
      MacCapa: ['FFD', 'RxonIdle', 'MainPower'],
      Model: 'Dimmer switch wo neutral',
      Param: "{'netatmoEnableDimmer': 1, 'PowerOnAfterOffOn': 255, 'BallastMaxLevel': 254, 'BallastMinLevel': 1}",
      Status: 'inDB',
      WidgetList: ['Zigbee - Dimmer switch wo neutral_LvlControl-000474000082a54f-01'],
      ZDeviceName: 'Inter Dimmer Legrand',
      _NwkId: '9c25'
    },
    {
      Battery: '',
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '00047400001f09a4',
      LQI: 80,
      MacCapa: ['FFD', 'RxonIdle', 'MainPower'],
      Model: 'Micromodule switch',
      Param: "{'PowerOnAfterOffOn': 255}",
      Status: 'inDB',
      WidgetList: ['Zigbee - Micromodule switch_Switch-00047400001f09a4-01'],
      ZDeviceName: 'Micromodule Legrand',
      _NwkId: '8706'
    },
    {
      Battery: '',
      ConsistencyCheck: 'ok',
      Health: '',
      IEEE: '00158d0003021601',
      LQI: 0,
      MacCapa: ['RFD', 'Battery'],
      Model: 'lumi.sensor_motion.aq2',
      Param: '{}',
      Status: 'inDB',
      WidgetList: [
        'Zigbee - lumi.sensor_motion.aq2_Motion-00158d0003021601-01',
        'Zigbee - lumi.sensor_motion.aq2_Lux-00158d0003021601-01'
      ],
      ZDeviceName: 'Lumi Motion',
      _NwkId: '6f81'
    },
    {
      Battery: 100,
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '0015bc001a01aa27',
      LQI: 83,
      MacCapa: ['RFD', 'Battery'],
      Model: 'MOSZB-140',
      Param: '{}',
      Status: 'inDB',
      WidgetList: [
        'Zigbee - MOSZB-140_Motion-0015bc001a01aa27-23',
        'Zigbee - MOSZB-140_Tamper-0015bc001a01aa27-23',
        'Zigbee - MOSZB-140_Voltage-0015bc001a01aa27-23',
        'Zigbee - MOSZB-140_Temp-0015bc001a01aa27-26',
        'Zigbee - MOSZB-140_Lux-0015bc001a01aa27-27'
      ],
      ZDeviceName: 'Motion frient',
      _NwkId: 'b9bc'
    },
    {
      Battery: 63,
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '00158d000323dabe',
      LQI: 61,
      MacCapa: ['RFD', 'Battery'],
      Model: 'lumi.sensor_switch',
      Param: '{}',
      Status: 'inDB',
      WidgetList: ['Zigbee - lumi.sensor_switch_SwitchAQ2-00158d000323dabe-01'],
      ZDeviceName: 'Lumi Switch (rond)',
      _NwkId: 'a029'
    },
    {
      Battery: 100.0,
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '000d6ffffea1e6da',
      LQI: 94,
      MacCapa: ['RFD', 'Battery'],
      Model: 'TRADFRI onoff switch',
      Param: '{}',
      Status: 'inDB',
      WidgetList: ['Zigbee - TRADFRI onoff switch_SwitchIKEA-000d6ffffea1e6da-01'],
      ZDeviceName: 'OnOff Ikea',
      _NwkId: 'c6ca'
    },
    {
      Battery: 100.0,
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '000b57fffe2c0dde',
      LQI: 87,
      MacCapa: ['RFD', 'Battery'],
      Model: 'TRADFRI wireless dimmer',
      Param: '{}',
      Status: 'inDB',
      WidgetList: ['Zigbee - TRADFRI wireless dimmer_GenericLvlControl-000b57fffe2c0dde-01'],
      ZDeviceName: 'Dim Ikea',
      _NwkId: '6c43'
    },
    {
      Battery: 100,
      ConsistencyCheck: 'ok',
      Health: 'Live',
      IEEE: '588e81fffe35f595',
      LQI: 80,
      MacCapa: ['RFD', 'Battery'],
      Model: 'Wiser2-Thermostat',
      Param: "{'WiserLockThermostat': 0, 'WiserRoomNumber': 1}",
      Status: 'inDB',
      WidgetList: [
        'Zigbee - Wiser2-Thermostat_Temp+Hum-588e81fffe35f595-01',
        'Zigbee - Wiser2-Thermostat_Humi-588e81fffe35f595-01',
        'Zigbee - Wiser2-Thermostat_Temp-588e81fffe35f595-01',
        'Zigbee - Wiser2-Thermostat_ThermoSetpoint-588e81fffe35f595-01',
        'Zigbee - Wiser2-Thermostat_Valve-588e81fffe35f595-01'
      ],
      ZDeviceName: 'Wiser Thermostat',
      _NwkId: '5a00'
    }
  ];
}
