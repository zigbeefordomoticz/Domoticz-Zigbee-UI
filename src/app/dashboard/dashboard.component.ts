import { Component, OnDestroy, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { VersionService } from '@app/services/version-service';
import { TranslateService } from '@ngx-translate/core';
import { Chart } from 'angular-highcharts';
import { forkJoin, timer } from 'rxjs';
import { GlobalPosition, InsidePlacement, Toppy, ToppyControl } from 'toppy';
import { PluginStats } from '../shared/models/plugin-stats';
import { DeviceByNameComponent } from './device-by-name/device-by-name.component';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { HeaderService } from '@app/services/header-service';
import { environment } from '@env/environment';
import { switchMap, retry, share, takeUntil, filter, map } from 'rxjs/operators';

const log = new Logger('DashboardComponent');

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnDestroy {
  poll = false;
  chart: Chart;
  devices: any;
  routers: any;
  inDbs: any;
  healthsLive: any;
  healthsNotSeen: any;
  healthsNotReachable: any;
  healthsOthers: any = {};
  pluginStats: PluginStats;
  totalTraficSent: any = {};
  totalTraficRetx: any = {};
  totalTraficReceived: any = {};
  totalTraficCluster: any = {};
  totalTraficCrc: any = {};
  maxLoad: any = {};
  currentLoad: any = {};
  devicesOnBattery: any;
  devicesOther: any;
  batterySup50: any;
  batterySup30: any;
  batteryInf30: any;

  advancedPieLoad: any;
  advancedPieSent: any;
  advancedPieReceived: any;
  advancedPieDevice: any;
  advancedPieState: any;
  advancedPieBattery: any;
  advancedPieLoadLabel: string;
  advancedPieSentLabel: string;
  advancedPieReceivedLabel: string;
  advancedPieDeviceLabel: string;
  advancedPieStateLabel: string;
  advancedPieBatteryLabel: string;

  gaugeType = 'full';
  gaugeAppendText = '';

  thick = 15;
  toppyControl: ToppyControl;

  animations = true;
  gradient = false;
  tooltipDisabled = false;
  colorSchemeROG = {
    domain: ['red', 'orange', 'green']
  };
  colorSchemeGROG = {
    domain: ['green', 'red', 'orange', 'gray']
  };
  colorSchemeGOR = {
    domain: ['green', 'blue', 'red']
  };
  colorSchemeGO = {
    domain: ['green', 'cyan']
  };
  colorSchemeGR = {
    domain: ['green', 'red']
  };

  date: Date;

  constructor(
    private apiService: ApiService,
    private toppy: Toppy,
    private versionService: VersionService,
    private headerService: HeaderService,
    private translateService: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.headerService.polling.subscribe(poll => {
      this.poll = poll;
      this.subs.add(
        timer(1, environment.refresh)
          .pipe(
            switchMap(() => this.getStats()),
            retry(),
            share(),
            takeUntil(this.headerService.polling.pipe(filter(val => val === false)))
          )
          .subscribe()
      );
    });

    if (!this.poll) {
      this.getStats().subscribe();
    }
    this.getInfos();
  }

  getInfos() {
    this.date = new Date();
    this.advancedPieLoadLabel = this.translateService.instant('dashboard.trafic.maxload.label');
    this.advancedPieSentLabel = this.translateService.instant('dashboard.trafic.total.trafic.sent.label');
    this.advancedPieReceivedLabel = this.translateService.instant('dashboard.trafic.total.trafic.received.label');
    this.advancedPieDeviceLabel = this.translateService.instant('dashboard.devices.label');
    this.advancedPieStateLabel = this.translateService.instant('dashboard.devices.state.label');
    this.advancedPieBatteryLabel = this.translateService.instant('dashboard.devices.battery.label');
  }

  percentageFormatting(value: any) {
    return Math.round(value);
  }

  createChart() {
    const tx: any[] = [];
    const rx: any[] = [];
    const load: any[] = [];

    this.pluginStats.Trend = [
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1320
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1321
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1322
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1323
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1324
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1325
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1326
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1327
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1328
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1329
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1330
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1331
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1332
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1333
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1334
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1335
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1336
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1337
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1338
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1339
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1340
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1341
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1342
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1343
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1344
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1345
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1346
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1347
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1348
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1349
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1350
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1351
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1352
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1353
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1354
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1355
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1356
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1357
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1358
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1359
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1360
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1361
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1362
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1363
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1364
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1365
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1366
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1367
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1368
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1369
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1370
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1371
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1372
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1373
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1374
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1375
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1376
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1377
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1378
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1379
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1380
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1381
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1382
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1383
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1384
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1385
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1386
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1387
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1388
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1389
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1390
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1391
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1392
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1393
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1394
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1395
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1396
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1397
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1398
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1399
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1400
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1401
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1402
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1403
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1404
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1405
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1406
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1407
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1408
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1409
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1410
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1411
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1412
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1413
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1414
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1415
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1416
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1417
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1418
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1419
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1420
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1421
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1422
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1423
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1424
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1425
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1426
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1427
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1428
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1429
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1430
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1431
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1432
      },
      {
        Load: 0,
        Rxps: 0.32,
        Txps: 0.08,
        _TS: 1433
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1434
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1435
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1436
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1437
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1438
      },
      {
        Load: 0,
        Rxps: 0.31,
        Txps: 0.08,
        _TS: 1439
      }
    ];
    const sorted = this.pluginStats.Trend.sort((t1, t2) => {
      const ts1 = t1._TS;
      const ts2 = t2._TS;
      if (ts1 > ts2) {
        return 1;
      }
      if (ts1 < ts2) {
        return -1;
      }
      return 0;
    });

    let secondsToSubstract = sorted.length * 5;
    sorted.forEach(trend => {
      const dateFin = new Date(this.date);
      const datePlot = new Date(dateFin.setSeconds(dateFin.getSeconds() - secondsToSubstract));
      secondsToSubstract = secondsToSubstract - 5;
      tx.push({ x: datePlot, y: trend.Txps });
      rx.push({ x: datePlot, y: trend.Rxps });
      load.push({ x: datePlot, y: trend.Load });
    });

    const chart = new Chart({
      chart: {
        type: 'line',
        height: '150'
      },
      title: {
        text: ''
      },
      legend: {
        align: 'center',
        verticalAlign: 'top',
        floating: true
      },
      xAxis: {
        allowDecimals: false,
        labels: {
          formatter: function () {
            const date = new Date(this.value);
            return (
              date.getHours() +
              (date.getMinutes() > 9 ? ':' + date.getMinutes() : ':0' + date.getMinutes()) +
              (date.getSeconds() > 9 ? ':' + date.getSeconds() : ':0' + date.getSeconds())
            );
          }
        },
        type: 'datetime'
      },
      yAxis: {
        title: {
          text: ''
        },
        labels: {
          formatter: function () {
            return this.value + '';
          }
        }
      },
      tooltip: {
        pointFormat: '{series.name} <b>{point.y}</b>'
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        series: {
          label: {
            connectorAllowed: false
          }
        }
      },
      series: [
        {
          name: this.translateService.instant('dashboard.txps'),
          data: tx,
          type: 'line'
        },
        {
          name: this.translateService.instant('dashboard.rxps'),
          data: rx,
          type: 'line'
        },
        {
          name: this.translateService.instant('dashboard.load'),
          data: load,
          type: 'line'
        }
      ]
    });
    this.chart = chart;

    this.subs.add(chart.ref$.subscribe());
  }

  open(name: string, event: any) {
    let devices;
    if (name === 'device') {
      if (event.name === this.translateService.instant('dashboard.devices.routers')) {
        devices = this.routers;
      } else {
        devices = this.devicesOther;
      }
    } else if (name === 'state') {
      if (event.name === this.translateService.instant('dashboard.devices.live')) {
        devices = this.healthsLive;
      } else if (event.name === this.translateService.instant('dashboard.devices.others')) {
        devices = this.healthsOthers;
      } else if (event.name === this.translateService.instant('dashboard.devices.notReachable')) {
        devices = this.healthsNotReachable;
      } else {
        devices = this.healthsNotSeen;
      }
    } else if (name === 'battery') {
      if (event.name === this.translateService.instant('dashboard.devices.battery.inf.30')) {
        devices = this.batteryInf30;
      } else if (event.name === this.translateService.instant('dashboard.devices.battery.sup.30')) {
        devices = this.batterySup30;
      } else {
        devices = this.batterySup50;
      }
    }

    this.toppyControl = this.toppy
      .position(
        new GlobalPosition({
          placement: InsidePlacement.BOTTOM,
          width: '80%',
          height: 'auto'
        })
      )
      .config({
        closeOnDocClick: false,
        closeOnEsc: true
      })
      .content(DeviceByNameComponent, { devices: devices })
      .create();

    this.subs.add(this.toppyControl.listen('t_compins').subscribe(comp => {}));

    this.toppyControl.open();
  }

  close() {
    if (this.toppyControl) {
      this.toppyControl.close();
    }
  }

  refresh() {
    this.getStats().subscribe();
    this.versionService.setReload(true);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.close();
  }

  private getStats() {
    return forkJoin([this.apiService.getPluginStats(), this.apiService.getZDevices()]).pipe(
      map(([res, devices]) => {
        this.pluginStats = res;
        this.createChart();
        this.totalTraficSent.label = this.translateService.instant('dashboard.trafic.total.trafic.sent');
        this.totalTraficSent.total = res.Sent;
        this.totalTraficRetx.label = this.translateService.instant('dashboard.trafic.retx');
        this.totalTraficRetx.total = ((res.ReTx / res.Sent) * 100).toFixed(0);
        this.totalTraficRetx.append = '%';
        this.totalTraficReceived.label = this.translateService.instant('dashboard.trafic.total.trafic.received');
        this.totalTraficReceived.total = res.Received;
        this.totalTraficCluster.label = this.translateService.instant('dashboard.trafic.cluster');
        this.totalTraficCluster.total = ((res.Cluster / res.Received) * 100).toFixed(0);
        this.totalTraficCluster.append = '%';
        this.totalTraficCrc.label = this.translateService.instant('dashboard.trafic.crc');
        this.totalTraficCrc.total = ((res.CRC / res.Received) * 100).toFixed(0);
        this.totalTraficCrc.append = '%';
        this.maxLoad.label = this.translateService.instant('dashboard.trafic.maxload');
        this.maxLoad.total = res.MaxLoad;
        this.currentLoad.label = this.translateService.instant('dashboard.trafic.currentload');
        this.currentLoad.total = res.CurrentLoad;
        this.advancedPieLoad = [
          { name: this.translateService.instant('dashboard.trafic.maxload'), value: res.MaxLoad - res.CurrentLoad },
          { name: this.translateService.instant('dashboard.trafic.currentload'), value: res.CurrentLoad }
        ];
        this.advancedPieSent = [
          { name: this.translateService.instant('dashboard.trafic.total.trafic.sent'), value: res.Sent - res.ReTx },
          { name: this.translateService.instant('dashboard.trafic.retx'), value: res.ReTx }
        ];
        this.advancedPieReceived = [
          {
            name: this.translateService.instant('dashboard.trafic.total.trafic.received'),
            value: res.Received - res.Cluster - res.CRC
          },
          { name: this.translateService.instant('dashboard.trafic.cluster'), value: res.Cluster },
          { name: this.translateService.instant('dashboard.trafic.crc'), value: res.CRC }
        ];
        this.devices = devices;
        this.devices.total = this.devices.length;
        this.devices.label = this.translateService.instant('devices');
        this.routers = this.devices.filter((router: any) => router.LogicalType === 'Router');
        this.devicesOther = this.devices.filter((router: any) => router.LogicalType !== 'Router');
        this.routers.label = this.translateService.instant('dashboard.devices.routers');
        this.routers.total = ((this.routers.length / this.devices.total) * 100).toFixed(0);
        this.routers.append = '%';
        this.inDbs = this.devices.filter((router: any) => router.Status === 'inDB');
        this.inDbs.label = this.translateService.instant('dashboard.devices.indb');
        this.inDbs.total = ((this.inDbs.length / this.devices.total) * 100).toFixed(0);
        this.inDbs.append = '%';
        this.healthsLive = this.devices.filter((device: any) => device.Health === 'Live' && device.Status !== 'notDB');
        this.healthsLive.label = this.translateService.instant('dashboard.devices.live');
        this.healthsLive.total = ((this.healthsLive.length / this.devices.total) * 100).toFixed(0);
        this.healthsLive.append = '%';
        this.healthsNotReachable = this.devices.filter((device: any) => {
          return device.Health === 'Not Reachable' && device.Status !== 'notDB';
        });
        this.healthsNotReachable.label = this.translateService.instant('dashboard.devices.notReachable');
        this.healthsNotReachable.total = ((this.healthsNotReachable.length / this.devices.total) * 100).toFixed(0);
        this.healthsNotReachable.append = '%';
        this.healthsNotSeen = this.devices.filter((device: any) => {
          return device.Health === 'Not seen last 24hours' && device.Status !== 'notDB';
        });
        this.healthsNotSeen.label = this.translateService.instant('dashboard.devices.notseen');
        this.healthsNotSeen.total = ((this.healthsNotSeen.length / this.devices.total) * 100).toFixed(0);
        this.healthsNotSeen.append = '%';
        this.healthsOthers = this.devices.filter((device: any) => {
          return (
            device.Health !== 'Not seen last 24hours' &&
            device.Health !== 'Not Reachable' &&
            device.Health !== 'Live' &&
            device.Status !== 'notDB'
          );
        });
        this.healthsOthers.label = this.translateService.instant('dashboard.devices.enddevice');
        this.healthsOthers.total = ((this.healthsOthers.length / this.devices.total) * 100).toFixed(0);
        this.healthsOthers.append = '%';
        this.advancedPieDevice = [
          {
            name: this.translateService.instant('dashboard.devices.routers'),
            value: this.routers.length
          },
          {
            name: this.translateService.instant('dashboard.devices.enddevice'),
            value: this.devices.length - this.routers.length
          }
        ];
        this.advancedPieState = [
          {
            name: this.translateService.instant('dashboard.devices.live'),
            value: this.healthsLive.length
          },
          {
            name: this.translateService.instant('dashboard.devices.notReachable'),
            value: this.healthsNotReachable.length
          },
          {
            name: this.translateService.instant('dashboard.devices.notseen'),
            value: this.healthsNotSeen.length
          },
          { name: this.translateService.instant('dashboard.devices.others'), value: this.healthsOthers.length }
        ];
        this.devicesOnBattery = devices.filter(
          (device: any) => device.PowerSource === 'Battery' && device.Status !== 'notDB'
        );
        const _batteryInf30 = this.devicesOnBattery.filter((device: any) => device.Battery <= 30);
        const _batterySup30 = this.devicesOnBattery.filter(
          (device: any) => device.Battery > 30 && device.Battery <= 50
        );
        const _batterySup50 = this.devicesOnBattery.filter((device: any) => device.Battery > 50);
        this.batteryInf30 = this.devices.filter((it: any) => _batteryInf30.find((iter: any) => iter.IEEE === it.IEEE));
        this.batterySup50 = this.devices.filter((it: any) => _batterySup50.find((iter: any) => iter.IEEE === it.IEEE));
        this.batterySup30 = this.devices.filter((it: any) => _batterySup30.find((iter: any) => iter.IEEE === it.IEEE));
        this.batteryInf30.totalDevices = this.devicesOnBattery.length;
        this.batteryInf30.label = this.translateService.instant('dashboard.devices.battery.inf.30');
        this.batteryInf30.total = this.batteryInf30.length;
        this.batteryInf30.append = this.translateService.instant('devices');
        this.batterySup30.label = this.translateService.instant('dashboard.devices.battery.sup.30');
        this.batterySup30.total = this.batterySup30.length;
        this.batterySup30.append = this.translateService.instant('devices');
        this.batterySup50.label = this.translateService.instant('dashboard.devices.battery.sup.50');
        this.batterySup50.total = this.batterySup50.length;
        this.batterySup50.append = this.translateService.instant('devices');
        this.advancedPieBattery = [
          {
            name: this.translateService.instant('dashboard.devices.battery.inf.30'),
            value: this.batteryInf30.length
          },
          {
            name: this.translateService.instant('dashboard.devices.battery.sup.30'),
            value: this.batterySup30.length
          },
          { name: this.translateService.instant('dashboard.devices.battery.sup.50'), value: this.batterySup50.length }
        ];
        this.headerService.setError(res.Error);
      })
    );
  }
}
