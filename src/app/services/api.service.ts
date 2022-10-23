import { Zlinky } from './../shared/models/zlinky';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '@app/core';
import { Capabilities } from '@app/shared/models/capabilities';
import { Command } from '@app/shared/models/command';
import { CommandZigpy } from '@app/shared/models/commandZigpy';
import { Device, ZDevices } from '@app/shared/models/device';
import { DeviceBind } from '@app/shared/models/device-bind';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { DomoticzEnv } from '@app/shared/models/domoticz-env';
import { DevicesAvailable, Group } from '@app/shared/models/group';
import { Cluster, NewDevice } from '@app/shared/models/new-hardware';
import { Plugin } from '@app/shared/models/plugin';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { Setting, Settings } from '@app/shared/models/setting';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { Binding } from '@app/shared/models/binding';
import { CasaiaDevice, UpdateCasaiaDevice } from '@app/shared/models/casaia-device';
import { Configure, Edit } from '@app/shared/models/configure-reporting';
import { DevicesByManufacturer, FirmwareManufacturer, FirmwareUpdate } from '@app/shared/models/firmware';
import { Relation } from '@app/shared/models/relation';

const routes = {
  devices: '/device',
  zDevices: '/zdevice',
  zdeviceRaw: '/zdevice-raw',
  zGroups: '/zgroup',
  settings: '/setting',
  settingsDebug: '/setting-debug',
  plugin: '/plugin',
  pluginStat: '/plugin-stat',
  nwkStat: '/nwk-stat',
  topologie: '/topologie',
  permitToJoin: '/permit-to-join',
  zdeviceName: '/zdevice-name',
  zgroupDevicesAvalaible: '/zgroup-list-available-device',
  reqTopology: '/req-topologie',
  reqInter: '/req-nwk-inter',
  swReset: '/sw-reset-coordinator',
  erasePDM: '/coordinator-erase-PDM',
  coordinator: '/coordinator',
  restartNeeded: '/restart-needed',
  domoticzEnv: '/domoticz-env',
  pluginHealth: '/plugin-health',
  rescanGroup: '/rescan-groups',
  reqNwkfull: '/req-nwk-full',
  pluginRestart: '/plugin-restart',
  devCommand: '/dev-command',
  devCap: '/dev-cap',
  newHardware: '/new-hrdwr/',
  receiveNewHardware: '/rcv-nw-hrdwr',
  binding: '/binding',
  unbinding: '/unbinding',
  rawCommand: '/raw-command',
  rawCommandZigpy: '/raw-zigbee',
  bindLSTcluster: '/bind-lst-cluster',
  bindLSTdevice: '/bind-lst-device',
  scanDeviceForGrp: '/scan-device-for-grp',
  logErrorHistory: '/log-error-history',
  clearErrorHistory: '/clear-error-history',
  otaFirmwareList: '/ota-firmware-list',
  otaFirmwareDeviceList: '/ota-firmware-device-list/',
  otaFirmwareUpdate: '/ota-firmware-update',
  casiaListDevices: '/casaia-list-devices',
  casiaIrcode: '/casaia-update-ircode',
  changeChannel: '/change-channel',
  pairingFullReset: '/full-reprovisionning',
  recreateWidgets: '/recreate-widgets',
  batteryState: '/battery-state',
  pluginUpgrade: '/plugin-upgrade',
  configureReporting: '/cfgrpt-ondemand-config',
  demandConfigureReporting: '/cfgrpt-ondemand',
  zlinky: '/zlinky'
};

const log = new Logger('ApiService');

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private httpClient: HttpClient, private toastr: ToastrService, private translate: TranslateService) {}

  getPluginhealth(): Observable<any> {
    return this.httpClient.get(routes.pluginHealth).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getDevices(): Observable<Array<Device>> {
    return this.httpClient.get(routes.devices).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getZDevices(filterCoordinator = false): Observable<ZDevices[]> {
    return this.httpClient.get<ZDevices[]>(routes.zDevices).pipe(
      map(devices =>
        devices.filter(device => {
          if (filterCoordinator && device.LogicalType === 'Coordinator') {
            return true;
          } else if (device.LogicalType !== 'Coordinator') {
            return true;
          }
        })
      ),
      catchError(error => this.handleError(error))
    );
  }

  getRawZDevices(): Observable<any> {
    return this.httpClient.get(routes.zdeviceRaw).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getZGroups(): Observable<Group[]> {
    return this.httpClient.get(routes.zGroups).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getSettings(): Observable<Settings[]> {
    return this.httpClient.get(routes.settings).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putSettings(settings: Array<Setting>): Observable<any> {
    return this.httpClient.put(routes.settings, settings).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getSettingsDebug(): Observable<any> {
    return this.httpClient.get(routes.settingsDebug).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putSettingsDebug(settings: Array<Setting>): Observable<any> {
    return this.httpClient.put(routes.settingsDebug, settings).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getPlugin(): Observable<Plugin> {
    return this.httpClient.get(routes.plugin).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getPluginStats(): Observable<PluginStats> {
    return this.httpClient.get(routes.pluginStat).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getLogErrorHistory(): Observable<Object> {
    return this.httpClient.get(routes.logErrorHistory).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  clearLogErrorHistory(): Observable<Object> {
    return this.httpClient.get(routes.clearErrorHistory).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getNwkStats(): Observable<Array<string>> {
    return this.httpClient.get(routes.nwkStat).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getTopologie(): Observable<Array<string>> {
    return this.httpClient.get(routes.topologie).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getReqTopologie(): Observable<any> {
    return this.httpClient.get(routes.reqTopology).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getReqInter(): Observable<any> {
    return this.httpClient.get(routes.reqInter).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getNwkFull(): Observable<any> {
    return this.httpClient.get(routes.reqNwkfull).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getTopologieByTimeStamp(timestamp: string): Observable<Relation[]> {
    return this.httpClient.get(routes.topologie + '/' + timestamp).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getNwkStatsByTimeStamp(timestamp: string): Observable<any> {
    return this.httpClient.get(routes.nwkStat + '/' + timestamp).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  deleteTopologieByTimeStamp(timestamp: string): Observable<any> {
    return this.httpClient.delete(routes.topologie + '/' + timestamp).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  deleteNwkStatsByTimeStamp(timestamp: string): Observable<any> {
    return this.httpClient.delete(routes.nwkStat + '/' + timestamp).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getPermitToJoin(): Observable<any> {
    return this.httpClient.get(routes.permitToJoin).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putPermitToJoin(settings: any): Observable<any> {
    return this.httpClient.put(routes.permitToJoin, settings).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getZDeviceName(): Observable<DeviceByName[]> {
    return this.httpClient.get(routes.zdeviceName).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putZDeviceName(devices: any): Observable<PluginStats> {
    return this.httpClient.put(routes.zdeviceName, devices).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  deleteZDeviceName(_NwkId: string): Observable<PluginStats> {
    return this.httpClient.delete(routes.zdeviceName + '/' + _NwkId).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getZGroupDevicesAvalaible(): Observable<Array<DevicesAvailable>> {
    return this.httpClient.get(routes.zgroupDevicesAvalaible).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putZGroups(groups: any): Observable<any> {
    return this.httpClient.put(routes.zGroups, groups).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getCoordinator(): Observable<any> {
    return this.httpClient.get(routes.coordinator).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getSwReset(): Observable<any> {
    return this.httpClient.get(routes.swReset).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getRescanGroup(): Observable<any> {
    return this.httpClient.get(routes.rescanGroup).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getErasePDM(): Observable<any> {
    return this.httpClient.get(routes.erasePDM).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getReloadPlugin() {
    return this.httpClient.get(routes.pluginRestart).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getUpgradePlugin() {
    return this.httpClient.get(routes.pluginUpgrade).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getReloadPluginOld(plugin: Plugin, domoticzEnv: DomoticzEnv): Observable<any> {
    const route =
      domoticzEnv.proto +
      '://' +
      domoticzEnv.WebUserName +
      ':' +
      domoticzEnv.WebPassword +
      '@' +
      domoticzEnv.host +
      ':' +
      domoticzEnv.port +
      '/json.htm?type=command&param=updatehardware&htype=94&idx=' +
      plugin.HardwareID +
      '&name=' +
      plugin.Name +
      '&username=' +
      domoticzEnv.WebUserName +
      '&password=' +
      domoticzEnv.WebPassword +
      '&address=' +
      plugin.Address +
      '&port=' +
      plugin.Port +
      '&serialport=' +
      plugin.SerialPort +
      '&Mode1=' +
      plugin.Mode1 +
      '&Mode2=' +
      plugin.Mode2 +
      '&Mode3=' +
      plugin.Mode3 +
      '&Mode4=' +
      plugin.Mode4 +
      '&Mode5=' +
      plugin.Mode5 +
      '&Mode6=' +
      plugin.Mode6 +
      '&extra=' +
      plugin.Key +
      '&enabled=true&datatimeout=0';

    const httpOptions = {
      headers: new HttpHeaders({
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      })
    };

    return this.httpClient
      .disableApiPrefix()
      .get(route, httpOptions)
      .pipe(
        map((body: any) => body),
        catchError(error => this.handleError(error))
      );
  }

  getRestartNeeded(): Observable<any> {
    return this.httpClient.get(routes.restartNeeded).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getDomoticzEnv(): Observable<DomoticzEnv> {
    return this.httpClient.get(routes.domoticzEnv).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getDevCap(id: string): Observable<Capabilities> {
    const route = routes.devCap + '/' + id;
    return this.httpClient.get(route).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putDevCommand(command: Command): Observable<any> {
    return this.httpClient.put(routes.devCommand, command).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getNewHardware(enable: boolean): Observable<any> {
    const enabled = enable ? 'enable' : 'disable';
    const route = routes.newHardware + enabled;

    return this.httpClient.get(route).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getReceiveNewHardware(): Observable<NewDevice> {
    return this.httpClient.get(routes.receiveNewHardware).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putBinding(binding: Binding): Observable<any> {
    return this.httpClient.put(routes.binding, binding).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putCommandRaw(command: Command): Observable<any> {
    return this.httpClient.put(routes.rawCommand, command).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putCommandRawZigpy(command: CommandZigpy): Observable<void> {
    return this.httpClient.put(routes.rawCommandZigpy, command).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getBindLSTcluster(): Observable<Cluster[]> {
    return this.httpClient.get(routes.bindLSTcluster).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getBindLSTdevice(id: string): Observable<DeviceBind[]> {
    const route = routes.bindLSTdevice + '/' + id;
    return this.httpClient.get(route).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putUnBinding(unbinding: Binding): Observable<any> {
    return this.httpClient.put(routes.unbinding, unbinding).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putScanDeviceForGrp(nwkids: string[]): Observable<any> {
    return this.httpClient.put(routes.scanDeviceForGrp, nwkids).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getOtaFirmware(): Observable<FirmwareManufacturer> {
    return this.httpClient.get(routes.otaFirmwareList).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getDeviceByOtaFirmware(ManufCode: string): Observable<DevicesByManufacturer[]> {
    return this.httpClient.get(routes.otaFirmwareDeviceList.concat(ManufCode)).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putOtaFirmware(devicesToUpdate: FirmwareUpdate[]): Observable<FirmwareUpdate> {
    return this.httpClient.put(routes.otaFirmwareUpdate, devicesToUpdate).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getCasiaDevices(): Observable<CasaiaDevice[]> {
    return this.httpClient.get(routes.casiaListDevices).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putCasiaIrcode(update: UpdateCasaiaDevice[]): Observable<void> {
    return this.httpClient.put(routes.casiaIrcode, update).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putChangeChannel(channel: number): Observable<any> {
    const param = { Channel: channel };
    return this.httpClient.put(routes.changeChannel, param).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putPairingFullReset(_NwkId: string): Observable<any> {
    const data = { NWKID: _NwkId };
    return this.httpClient.put(routes.pairingFullReset, data).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putRecreateWidgets(_NwkId: string): Observable<any> {
    const data = { NWKID: _NwkId };
    return this.httpClient.put(routes.recreateWidgets, data).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getBatteryState(): Observable<any> {
    return this.httpClient.get(routes.batteryState).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getTriggerConfigureReporting(_NwkId: string): Observable<any> {
    return this.httpClient.get(routes.demandConfigureReporting + '/' + _NwkId).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getConfigureReporting(_NwkId: string): Observable<Configure[]> {
    return this.httpClient.get(routes.configureReporting + '/' + _NwkId).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  putConfigureReporting(_NwkId: string, clusters: Configure[]): Observable<void> {
    const data = new Edit();
    data.Nwkid = _NwkId;
    data.Clusters = clusters;
    return this.httpClient.put(routes.configureReporting, data).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  deleteConfigureReporting(_NwkId: string): Observable<void> {
    return this.httpClient.delete(routes.configureReporting + '/' + _NwkId).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getZlinky(): Observable<Zlinky[]> {
    return this.httpClient.get(routes.zlinky).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  private handleError(error: any) {
    log.error(error);
    this.toastr.error(error.status + ' ' + error.statusText, this.translate.instant('api.global.error.notify'));
    return throwError(error);
  }
}
