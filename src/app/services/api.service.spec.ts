import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CoreModule, Logger, LogLevel } from '@app/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from './api.service';
import pluginHelp from './fixtures/plugin-help.stable9.json';

// fixtures/plugin-help.stable9.json is the answer of /rest-z4d/1/help: every command the plugin serves,
// with its verbs (REST_COMMANDS in the plugin's Classes/WebServer/dispatcher.py). Refresh it from a
// plugin running a stable9 release, then format it with prettier:
//   curl -s http://<plugin>:9440/rest-z4d/1/help | python3 -m json.tool --sort-keys \
//     > src/app/services/fixtures/plugin-help.stable9.json

const P = '/rest-z4d/1';
const NWKID = 'a1b2';
const IEEE = '00158d0000000001';
const TS = '1764300000';

/**
 * Every ApiService method: the request it sends. Bodies are what the method builds; for a body it
 * passes on as given, a sample stands in. `response` is the answer flushed back, when the method
 * reads it.
 */
interface Call {
  call: (api: ApiService) => Observable<unknown>;
  method: 'GET' | 'PUT' | 'DELETE';
  url: string;
  body?: unknown;
  response?: unknown;
}

const plugin = {
  HardwareID: 3,
  Name: 'Zigbee',
  Address: '127.0.0.1',
  Port: '9440',
  SerialPort: '/dev/ttyUSB0',
  Mode1: 'm1',
  Mode2: 'm2',
  Mode3: 'm3',
  Mode4: 'm4',
  Mode5: 'm5',
  Mode6: 'm6',
  Key: 'Zigate'
};
const domoticzEnv = { proto: 'http', WebUserName: 'user', WebPassword: 'pass', host: 'domoticz.local', port: '8080' };
const reloadOldUrl =
  'http://user:pass@domoticz.local:8080/json.htm?type=command&param=updatehardware&htype=94&idx=3&name=Zigbee' +
  '&username=user&password=pass&address=127.0.0.1&port=9440&serialport=/dev/ttyUSB0' +
  '&Mode1=m1&Mode2=m2&Mode3=m3&Mode4=m4&Mode5=m5&Mode6=m6&extra=Zigate&enabled=true&datatimeout=0';

const settings = [{ Name: 'enablegroupmanagement', current: 1 }];
const sample = { any: 'body' };
const scene = { name: 'Evening', transitionTime: 2, members: [NWKID] };
const clusters = [{ ClusterId: '0006', Attributes: ['0000'] }];

const CALLS: Record<string, Call> = {
  downloadLog: {
    call: a => a.downloadLog('/download/PluginZigbee_01.log'),
    method: 'GET',
    url: '/download/PluginZigbee_01.log',
    response: new Blob(['log'])
  },
  getPluginhealth: { call: a => a.getPluginhealth(), method: 'GET', url: `${P}/plugin-health` },
  getDevices: { call: a => a.getDevices(), method: 'GET', url: `${P}/device` },
  getZDevices: { call: a => a.getZDevices(), method: 'GET', url: `${P}/zdevice`, response: [] },
  getRawZDevices: { call: a => a.getRawZDevices(), method: 'GET', url: `${P}/zdevice-raw`, response: [] },
  getRawZDevice: { call: a => a.getRawZDevice(NWKID), method: 'GET', url: `${P}/zdevice-raw/${NWKID}` },
  getZGroups: { call: a => a.getZGroups(), method: 'GET', url: `${P}/zgroup` },
  getSettings: { call: a => a.getSettings(), method: 'GET', url: `${P}/setting` },
  putSettings: { call: a => a.putSettings(settings as any), method: 'PUT', url: `${P}/setting`, body: settings },
  getSettingsDebug: { call: a => a.getSettingsDebug(), method: 'GET', url: `${P}/setting-debug` },
  putSettingsDebug: {
    call: a => a.putSettingsDebug(settings as any),
    method: 'PUT',
    url: `${P}/setting-debug`,
    body: settings
  },
  getPlugin: { call: a => a.getPlugin(), method: 'GET', url: `${P}/plugin` },
  getPluginStats: { call: a => a.getPluginStats(), method: 'GET', url: `${P}/plugin-stat` },
  getLogErrorHistory: { call: a => a.getLogErrorHistory(), method: 'GET', url: `${P}/log-error-history` },
  clearLogErrorHistory: { call: a => a.clearLogErrorHistory(), method: 'GET', url: `${P}/clear-error-history` },
  getNwkStats: { call: a => a.getNwkStats(), method: 'GET', url: `${P}/nwk-stat` },
  getTopologie: { call: a => a.getTopologie(), method: 'GET', url: `${P}/topologie` },
  getReqTopologie: { call: a => a.getReqTopologie(), method: 'GET', url: `${P}/req-topologie` },
  getReqInter: { call: a => a.getReqInter(), method: 'GET', url: `${P}/req-nwk-inter` },
  getNwkFull: { call: a => a.getNwkFull(), method: 'GET', url: `${P}/req-nwk-full` },
  getTopologieByTimeStamp: { call: a => a.getTopologieByTimeStamp(TS), method: 'GET', url: `${P}/topologie/${TS}` },
  getTopologyScans: { call: a => a.getTopologyScans(), method: 'GET', url: `${P}/topology-scan` },
  getTopologyScan: { call: a => a.getTopologyScan(+TS), method: 'GET', url: `${P}/topology-scan/${TS}` },
  deleteTopologyScan: { call: a => a.deleteTopologyScan(+TS), method: 'DELETE', url: `${P}/topology-scan/${TS}` },
  getReqTopologyAssociatedDevices: {
    call: a => a.getReqTopologyAssociatedDevices(),
    method: 'GET',
    url: `${P}/topology-scan-associated-devices`
  },
  deleteTopologyScans: { call: a => a.deleteTopologyScans(), method: 'DELETE', url: `${P}/topology-scan` },
  getNwkStatsByTimeStamp: { call: a => a.getNwkStatsByTimeStamp(TS), method: 'GET', url: `${P}/nwk-stat/${TS}` },
  deleteTopologieByTimeStamp: {
    call: a => a.deleteTopologieByTimeStamp(TS),
    method: 'DELETE',
    url: `${P}/topologie/${TS}`
  },
  deleteNwkStatsByTimeStamp: {
    call: a => a.deleteNwkStatsByTimeStamp(TS),
    method: 'DELETE',
    url: `${P}/nwk-stat/${TS}`
  },
  getPermitToJoin: { call: a => a.getPermitToJoin(), method: 'GET', url: `${P}/permit-to-join` },
  putPermitToJoin: { call: a => a.putPermitToJoin(sample), method: 'PUT', url: `${P}/permit-to-join`, body: sample },
  getZDeviceName: { call: a => a.getZDeviceName(), method: 'GET', url: `${P}/zdevice-name` },
  putZDeviceName: { call: a => a.putZDeviceName(sample), method: 'PUT', url: `${P}/zdevice-name`, body: sample },
  deleteZDeviceName: { call: a => a.deleteZDeviceName(NWKID), method: 'DELETE', url: `${P}/zdevice-name/${NWKID}` },
  getZGroupDevicesAvalaible: {
    call: a => a.getZGroupDevicesAvalaible(),
    method: 'GET',
    url: `${P}/zgroup-list-available-device`
  },
  createZGroupWithId: { call: a => a.createZGroupWithId(sample), method: 'PUT', url: `${P}/zgroup`, body: sample },
  putZGroups: { call: a => a.putZGroups(sample), method: 'PUT', url: `${P}/zgroup`, body: sample },
  getAllScenes: { call: a => a.getAllScenes(), method: 'GET', url: `${P}/scenes` },
  getGroupScenes: { call: a => a.getGroupScenes('0001'), method: 'GET', url: `${P}/scenes/0001` },
  scanGroupScenes: { call: a => a.scanGroupScenes('0001'), method: 'PUT', url: `${P}/scenes/0001/scan`, body: {} },
  createScene: { call: a => a.createScene('0001', scene), method: 'PUT', url: `${P}/scenes/0001`, body: scene },
  editScene: {
    call: a => a.editScene('0001', '02', { name: 'Night', comment: '', members: [NWKID] }),
    method: 'PUT',
    url: `${P}/scenes/0001/02`,
    body: { name: 'Night', comment: '', members: [NWKID] }
  },
  captureScene: {
    call: a => a.captureScene('0001', '02', { transitionTime: 0, members: [NWKID] }),
    method: 'PUT',
    url: `${P}/scenes/0001/02/capture`,
    body: { transitionTime: 0, members: [NWKID] }
  },
  recallScene: { call: a => a.recallScene('0001', '02'), method: 'PUT', url: `${P}/scenes/0001/02/recall`, body: {} },
  retryScene: { call: a => a.retryScene('0001', '02'), method: 'PUT', url: `${P}/scenes/0001/02/retry`, body: {} },
  deleteScene: { call: a => a.deleteScene('0001', '02'), method: 'DELETE', url: `${P}/scenes/0001/02` },
  getCoordinator: { call: a => a.getCoordinator(), method: 'GET', url: `${P}/coordinator` },
  getSwReset: { call: a => a.getSwReset(), method: 'GET', url: `${P}/sw-reset-coordinator` },
  getRescanGroup: { call: a => a.getRescanGroup(), method: 'GET', url: `${P}/rescan-groups` },
  getErasePDM: { call: a => a.getErasePDM(), method: 'GET', url: `${P}/coordinator-erase-PDM` },
  getReloadPlugin: { call: a => a.getReloadPlugin(), method: 'GET', url: `${P}/plugin-restart` },
  getUpgradePlugin: { call: a => a.getUpgradePlugin(), method: 'GET', url: `${P}/plugin-upgrade` },
  getReloadPluginOld: {
    call: a => a.getReloadPluginOld(plugin as any, domoticzEnv as any),
    method: 'GET',
    url: reloadOldUrl
  },
  getRestartNeeded: { call: a => a.getRestartNeeded(), method: 'GET', url: `${P}/restart-needed` },
  getDomoticzEnv: { call: a => a.getDomoticzEnv(), method: 'GET', url: `${P}/domoticz-env` },
  getDevCap: { call: a => a.getDevCap(NWKID), method: 'GET', url: `${P}/dev-cap/${NWKID}` },
  putDevCommand: { call: a => a.putDevCommand(sample as any), method: 'PUT', url: `${P}/dev-command`, body: sample },
  getNewHardware: { call: a => a.getNewHardware(true), method: 'GET', url: `${P}/new-hrdwr/enable` },
  getReceiveNewHardware: { call: a => a.getReceiveNewHardware(), method: 'GET', url: `${P}/rcv-nw-hrdwr` },
  putBinding: { call: a => a.putBinding(sample as any), method: 'PUT', url: `${P}/binding`, body: sample },
  putCommandRaw: { call: a => a.putCommandRaw(sample as any), method: 'PUT', url: `${P}/raw-command`, body: sample },
  putCommandRawZigpy: {
    call: a => a.putCommandRawZigpy(sample as any),
    method: 'PUT',
    url: `${P}/raw-zigbee`,
    body: sample
  },
  getBindLSTcluster: { call: a => a.getBindLSTcluster(), method: 'GET', url: `${P}/bind-lst-cluster` },
  getBindingTableRequest: {
    call: a => a.getBindingTableRequest(NWKID),
    method: 'GET',
    url: `${P}/binding-table-req/${NWKID}`
  },
  getBindingTable: { call: a => a.getBindingTable(NWKID), method: 'GET', url: `${P}/binding-table-disp/${NWKID}` },
  getBindLSTdevice: { call: a => a.getBindLSTdevice('0006'), method: 'GET', url: `${P}/bind-lst-device/0006` },
  putUnBinding: { call: a => a.putUnBinding(sample as any), method: 'PUT', url: `${P}/unbinding`, body: sample },
  putScanDeviceForGrp: {
    call: a => a.putScanDeviceForGrp([NWKID]),
    method: 'PUT',
    url: `${P}/scan-device-for-grp`,
    body: [NWKID]
  },
  getOtaFirmware: { call: a => a.getOtaFirmware(), method: 'GET', url: `${P}/ota-firmware-list` },
  getDeviceByOtaFirmware: {
    call: a => a.getDeviceByOtaFirmware('117c'),
    method: 'GET',
    url: `${P}/ota-firmware-device-list/117c`
  },
  putOtaFirmware: {
    call: a => a.putOtaFirmware([sample] as any),
    method: 'PUT',
    url: `${P}/ota-firmware-update`,
    body: [sample]
  },
  deleteOtaFirmware: {
    call: a => a.deleteOtaFirmware(NWKID),
    method: 'DELETE',
    url: `${P}/ota-firmware-update/${NWKID}`
  },
  getCasiaDevices: { call: a => a.getCasiaDevices(), method: 'GET', url: `${P}/casaia-list-devices` },
  putCasiaIrcode: {
    call: a => a.putCasiaIrcode([sample] as any),
    method: 'PUT',
    url: `${P}/casaia-update-ircode`,
    body: [sample]
  },
  putChangeChannel: {
    call: a => a.putChangeChannel(15),
    method: 'PUT',
    url: `${P}/change-channel`,
    body: { Channel: 15 }
  },
  putPairingFullReset: {
    call: a => a.putPairingFullReset(NWKID),
    method: 'PUT',
    url: `${P}/full-reprovisionning`,
    body: { NWKID }
  },
  putRecreateWidgets: {
    call: a => a.putRecreateWidgets(NWKID),
    method: 'PUT',
    url: `${P}/recreate-widgets`,
    body: { NWKID }
  },
  putRecreateGreenPowerWidgets: {
    call: a => a.putRecreateGreenPowerWidgets(IEEE),
    method: 'PUT',
    url: `${P}/recreate-widgets`,
    body: { IEEE }
  },
  getBatteryState: { call: a => a.getBatteryState(), method: 'GET', url: `${P}/battery-state` },
  getTriggerConfigureReporting: {
    call: a => a.getTriggerConfigureReporting(NWKID),
    method: 'GET',
    url: `${P}/cfgrpt-ondemand/${NWKID}`
  },
  putReportingRead: { call: a => a.putReportingRead(NWKID), method: 'PUT', url: `${P}/cfgrpt-read/${NWKID}`, body: {} },
  getReportingRead: { call: a => a.getReportingRead(NWKID), method: 'GET', url: `${P}/cfgrpt-read/${NWKID}` },
  getConfigureReporting: {
    call: a => a.getConfigureReporting(NWKID),
    method: 'GET',
    url: `${P}/cfgrpt-ondemand-config/${NWKID}`
  },
  putConfigureReporting: {
    call: a => a.putConfigureReporting(NWKID, clusters as any),
    method: 'PUT',
    url: `${P}/cfgrpt-ondemand-config`,
    body: { Nwkid: NWKID, Clusters: clusters }
  },
  deleteConfigureReporting: {
    call: a => a.deleteConfigureReporting(NWKID),
    method: 'DELETE',
    url: `${P}/cfgrpt-ondemand-config/${NWKID}`
  },
  getZlinky: { call: a => a.getZlinky(), method: 'GET', url: `${P}/zlinky` },
  getGammaTroniqueTicmeter: {
    call: a => a.getGammaTroniqueTicmeter(),
    method: 'GET',
    url: `${P}/gamma-troniques-ticmeter`
  },
  getChameleonTicmeter: { call: a => a.getChameleonTicmeter(), method: 'GET', url: `${P}/chameleon-ticmeter` },
  getLog: { call: a => a.getLog(), method: 'GET', url: `${P}/plugin-log` },
  getOtaFirmwareAvailable: {
    call: a => a.getOtaFirmwareAvailable(),
    method: 'GET',
    url: `${P}/ota-firmware-available`
  },
  getIeee2nwkRaw: { call: a => a.getIeee2nwkRaw(), method: 'GET', url: `${P}/ieee2nwk-raw` },
  getRawZgpDevices: { call: a => a.getRawZgpDevices(), method: 'GET', url: `${P}/zgp-device-raw` },
  getZgpPairing: { call: a => a.getZgpPairing(), method: 'GET', url: `${P}/zgp-pairing/0` },
  putZgpPairing: {
    call: a => a.putZgpPairing(180, 'A9Z1'),
    method: 'PUT',
    url: `${P}/zgp-pairing`,
    body: { Duration: 180, Model: 'A9Z1' }
  },
  getZgpModels: { call: a => a.getZgpModels(), method: 'GET', url: `${P}/zgp-models` },
  getRawZgpDevice: { call: a => a.getRawZgpDevice(IEEE), method: 'GET', url: `${P}/zgp-device-raw/${IEEE}` },
  putZgpDeviceModel: {
    call: a => a.putZgpDeviceModel(IEEE, 'A9Z1'),
    method: 'PUT',
    url: `${P}/zgp-device/${IEEE}`,
    body: { Model: 'A9Z1' }
  },
  deleteZgpDevice: { call: a => a.deleteZgpDevice(IEEE), method: 'DELETE', url: `${P}/zgp-device/${IEEE}` },
  getHelp: { call: a => a.getHelp(), method: 'GET', url: `${P}/help` },
  getNonOptimizedDevice: {
    call: a => a.getNonOptimizedDevice(NWKID),
    method: 'GET',
    url: `${P}/non-optmize-device-configuration/${NWKID}`
  }
};

/**
 * Called by the UI but not served by the stable9 plugin in the fixture. Each entry names where the
 * route comes from; remove it once a release serves it and the fixture is refreshed.
 */
const NOT_ON_STABLE9: Record<string, string> = {
  'cfgrpt-read': 'plugin 9.1.011 (integration/release-9.1.011)'
};

const help = pluginHelp as Record<string, { Verbs: string[] }>;

describe('ApiService', () => {
  const level = Logger.level;
  let api: ApiService;
  let backend: HttpTestingController;
  let toastr: { error: ReturnType<typeof vi.fn> };

  beforeAll(() => (Logger.level = LogLevel.Off));
  afterAll(() => (Logger.level = level));

  beforeEach(() => {
    toastr = { error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: toastr },
        { provide: TranslateService, useValue: { instant: (key: string) => key } }
      ]
    });
    api = TestBed.inject(ApiService);
    backend = TestBed.inject(HttpTestingController);
  });

  // A request left open fails this test only: the module is reset even when verify throws
  afterEach(() => {
    try {
      backend.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  it('has a row in the table for every method', () => {
    const methods = Object.getOwnPropertyNames(ApiService.prototype).filter(
      name => name !== 'constructor' && name !== 'handleError'
    );
    expect(Object.keys(CALLS).sort()).toEqual(methods.sort());
  });

  describe.each(Object.entries(CALLS))('%s', (_name, c) => {
    it(`sends ${c.method} ${c.url.replace(P, '')}`, () => {
      c.call(api).subscribe();
      const req = backend.expectOne(r => r.urlWithParams === c.url);
      expect(req.request.method).toBe(c.method);
      expect(req.request.body).toEqual(c.body ?? null);
      req.flush(c.response ?? {});
    });
  });

  describe('against the stable9 plugin (fixtures/plugin-help.stable9.json)', () => {
    const rows = Object.entries(CALLS).filter(([, c]) => c.url.startsWith(P + '/'));

    it.each(rows)('%s: the plugin serves the route with that verb', (_name, c) => {
      const command = c.url.slice(P.length + 1).split('/')[0];
      if (NOT_ON_STABLE9[command]) {
        expect(help, `${command} is now in the fixture: drop it from NOT_ON_STABLE9`).not.toHaveProperty([command]);
        return;
      }
      expect(help, `the plugin has no /${command}`).toHaveProperty([command]);
      expect(help[command].Verbs).toContain(c.method);
    });
  });

  describe('downloadLog', () => {
    it('asks for the whole response, as a Blob', () => {
      let got: any;
      api.downloadLog('/download/PluginZigbee_01.log').subscribe(r => (got = r));
      const req = backend.expectOne('/download/PluginZigbee_01.log');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['log']), { headers: { 'Content-Disposition': 'attachment' } });
      expect(got.status).toBe(200);
      expect(got.headers.get('Content-Disposition')).toBe('attachment');
      expect(got.body).toBeInstanceOf(Blob);
    });
  });

  describe('getReloadPluginOld', () => {
    it('sends text/plain to the Domoticz URL, without the API prefix', () => {
      api.getReloadPluginOld(plugin as any, domoticzEnv as any).subscribe();
      const req = backend.expectOne(reloadOldUrl);
      expect(req.request.headers.get('Content-Type')).toBe('text/plain');
      req.flush({});
    });
  });

  describe('what the methods do with the answer', () => {
    const devices = [
      { Nwkid: '0000', LogicalType: 'Coordinator' },
      { Nwkid: NWKID, LogicalType: 'Router' },
      { Nwkid: 'c3d4', LogicalType: 'End Device' }
    ];

    it('getZDevices() leaves the coordinator out', () => {
      let got: unknown;
      api.getZDevices().subscribe(d => (got = d));
      backend.expectOne(`${P}/zdevice`).flush(devices);
      expect(got).toEqual(devices.slice(1));
    });

    it('getZDevices(true) keeps the coordinator', () => {
      let got: unknown;
      api.getZDevices(true).subscribe(d => (got = d));
      backend.expectOne(`${P}/zdevice`).flush(devices);
      expect(got).toEqual(devices);
    });

    it('getRawZDevices(true) keeps only the devices with CertifiedDevice false', () => {
      const raw = [
        { NwkId: NWKID, CertifiedDevice: false },
        { NwkId: 'c3d4', CertifiedDevice: true },
        { NwkId: 'e5f6' }
      ];
      let got: unknown;
      api.getRawZDevices(true).subscribe(d => (got = d));
      backend.expectOne(`${P}/zdevice-raw`).flush(raw);
      expect(got).toEqual([raw[0]]);

      api.getRawZDevices().subscribe(d => (got = d));
      backend.expectOne(`${P}/zdevice-raw`).flush(raw);
      expect(got).toEqual(raw);
    });

    it('getNewHardware(false) closes pairing', () => {
      api.getNewHardware(false).subscribe();
      backend.expectOne(`${P}/new-hrdwr/disable`).flush({});
    });

    it('getZgpPairing asks for the events after `since`', () => {
      api.getZgpPairing(42).subscribe();
      backend.expectOne(`${P}/zgp-pairing/42`).flush({});
    });
  });

  describe('errors', () => {
    function fail(c: Call, body: unknown, status: number, statusText: string) {
      let caught: any;
      let next: unknown = 'nothing';
      c.call(api).subscribe({ next: v => (next = v), error: e => (caught = e) });
      backend.expectOne(r => r.urlWithParams === c.url).flush(body, { status, statusText });
      return { caught, next };
    }

    // The answer of rest_TopologyScan on stable9 while a scan runs
    const busy = { BE_Error: 'A topology scan is already in progress' };

    it('shows the BE_Error message of the plugin, and passes the error on', () => {
      const { caught } = fail(CALLS.getReqTopologyAssociatedDevices, busy, 400, 'BAD REQUEST');
      expect(toastr.error).toHaveBeenCalledWith(busy.BE_Error, 'api.global.error.notify');
      expect(caught.status).toBe(400);
    });

    it('shows status and status text when there is no BE_Error', () => {
      fail(CALLS.getPlugin, null, 500, 'Internal Server Error');
      expect(toastr.error).toHaveBeenCalledWith('500 Internal Server Error', 'api.global.error.notify');
    });

    it('ignores a BE_Error that is not a string', () => {
      fail(CALLS.getPlugin, { BE_Error: { code: 1 } }, 400, 'BAD REQUEST');
      expect(toastr.error).toHaveBeenCalledWith('400 BAD REQUEST', 'api.global.error.notify');
    });

    it('shows the status for a failed download, whose body is a Blob', () => {
      let caught: any;
      api.downloadLog('/download/missing.log').subscribe({ error: e => (caught = e) });
      backend
        .expectOne('/download/missing.log')
        .flush(new Blob(['not found']), { status: 404, statusText: 'Not Found' });
      expect(caught.status).toBe(404);
      expect(toastr.error).toHaveBeenCalledWith('404 Not Found', 'api.global.error.notify');
    });

    it('shows "0 Unknown Error" when the plugin cannot be reached', () => {
      api.getPlugin().subscribe({ error: () => undefined });
      // The xhr backend reports a refused connection as status 0, 'Unknown Error'
      backend.expectOne(`${P}/plugin`).error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
      expect(toastr.error).toHaveBeenCalledWith('0 Unknown Error', 'api.global.error.notify');
    });

    it.each(['createZGroupWithId', 'getAllScenes', 'getGroupScenes', 'createScene', 'recallScene', 'deleteScene'])(
      '%s leaves the error to the caller, without a toast',
      name => {
        const { caught } = fail(CALLS[name], { error: 'GRP0001' }, 400, 'BAD REQUEST');
        expect(caught.error).toEqual({ error: 'GRP0001' });
        expect(toastr.error).not.toHaveBeenCalled();
      }
    );

    it.each([
      ['getZgpPairing', null],
      ['getZgpModels', []],
      ['getRawZgpDevice', null]
    ])('%s answers %j on an error, without a toast', (name, fallback) => {
      const { caught, next } = fail(CALLS[name as string], null, 404, 'Not Found');
      expect(caught).toBeUndefined();
      expect(next).toEqual(fallback);
      expect(toastr.error).not.toHaveBeenCalled();
    });
  });
});
