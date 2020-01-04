import { Location } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '@app/core';
import { Capabilities } from '@app/shared/models/capabilities';
import { Command } from '@app/shared/models/command';
import { Device } from '@app/shared/models/device';
import { DomoticzEnv } from '@app/shared/models/domoticz-env';
import { DevicesAvailable } from '@app/shared/models/group';
import { NewDevice } from '@app/shared/models/new-hardware';
import { Plugin } from '@app/shared/models/plugin';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { Setting } from '@app/shared/models/setting';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { Binding } from '../shared/models/binding';

const routes = {
  devices: '/device',
  zDevices: '/zdevice',
  zdeviceRaw: '/zdevice-raw',
  zGroups: '/zgroup',
  settings: '/setting',
  plugin: '/plugin',
  pluginStat: '/plugin-stat',
  nwkStat: '/nwk-stat',
  topologie: '/topologie',
  permitToJoin: '/permit-to-join',
  zdeviceName: '/zdevice-name',
  zgroupDevicesAvalaible: '/zgroup-list-available-device',
  reqTopology: '/req-topologie',
  reqInter: '/req-nwk-inter',
  swResetZigate: '/sw-reset-zigate',
  zigateErasePDM: '/zigate-erase-PDM',
  zigate: '/zigate',
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
  binding: '/binding'
};

const log = new Logger('ApiService');

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private httpClient: HttpClient, private location: Location) {}

  getPluginhealth(): Observable<Array<any>> {
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

  getZDevices(): Observable<any> {
    return this.httpClient.get(routes.zDevices).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getRawZDevices(): Observable<any> {
    return this.httpClient.get(routes.zdeviceRaw).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getZGroups(): Observable<any> {
    return this.httpClient.get(routes.zGroups).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getSettings(): Observable<any> {
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

  getTopologieByTimeStamp(timestamp: string): Observable<any> {
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

  getZigate(): Observable<any> {
    return this.httpClient.get(routes.zigate).pipe(
      map((body: any) => body),
      catchError(error => this.handleError(error))
    );
  }

  getSwResetZigate(): Observable<any> {
    return this.httpClient.get(routes.swResetZigate).pipe(
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

  getZigateErasePDM(): Observable<any> {
    return this.httpClient.get(routes.zigateErasePDM).pipe(
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

  private handleError(error: any) {
    log.error(error);
    return throwError(error);
  }
}
