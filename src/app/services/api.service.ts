import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { DomoticzEnv } from '@app/shared/models/domoticz-env';
import { Plugin } from '@app/shared/models/plugin';
import { Device } from '@app/shared/models/device';
import { Setting } from '@app/shared/models/setting';
import { DevicesAvailable } from '@app/shared/models/group';

const routes = {
  devices: '/device',
  zDevices: '/zdevice',
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
  domoticzEnv: '/domoticz-env'
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private httpClient: HttpClient, private location: Location) {}

  getDevices(): Observable<Array<Device>> {
    return this.httpClient.get(routes.devices).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getZDevices(): Observable<any> {
    return this.httpClient.get(routes.zDevices).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getZGroups(): Observable<any> {
    return this.httpClient.get(routes.zGroups).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getSettings(): Observable<any> {
    return this.httpClient.get(routes.settings).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  putSettings(settings: Array<Setting>): Observable<any> {
    return this.httpClient.put(routes.settings, settings).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getPlugin(): Observable<Plugin> {
    return this.httpClient.get(routes.plugin).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getPluginStats(): Observable<PluginStats> {
    return this.httpClient.get(routes.pluginStat).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getNwkStats(): Observable<PluginStats> {
    return this.httpClient.get(routes.nwkStat).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getTopologie(): Observable<PluginStats> {
    return this.httpClient.get(routes.topologie).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getReqTopologie(): Observable<any> {
    return this.httpClient.get(routes.reqTopology).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getReqInter(): Observable<any> {
    return this.httpClient.get(routes.reqInter).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getTopologieByTimeStamp(timestamp: string): Observable<any> {
    return this.httpClient.get(routes.topologie + '/' + timestamp).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getNwkStatsByTimeStamp(timestamp: string): Observable<any> {
    return this.httpClient.get(routes.nwkStat + '/' + timestamp).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  deleteTopologieByTimeStamp(timestamp: string): Observable<any> {
    return this.httpClient.delete(routes.topologie + '/' + timestamp).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  deleteNwkStatsByTimeStamp(timestamp: string): Observable<any> {
    return this.httpClient.delete(routes.nwkStat + '/' + timestamp).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getPermitToJoin(): Observable<any> {
    return this.httpClient.get(routes.permitToJoin).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  putPermitToJoin(settings: any): Observable<any> {
    return this.httpClient.put(routes.permitToJoin, settings).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getZDeviceName(): Observable<PluginStats> {
    return this.httpClient.get(routes.zdeviceName).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  putZDeviceName(devices: any): Observable<PluginStats> {
    return this.httpClient.put(routes.zdeviceName, devices).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getZGroupDevicesAvalaible(): Observable<Array<DevicesAvailable>> {
    return this.httpClient.get(routes.zgroupDevicesAvalaible).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  putZGroups(groups: any): Observable<any> {
    return this.httpClient.put(routes.zGroups, groups).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getZigate(): Observable<any> {
    return this.httpClient.get(routes.zigate).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getSwResetZigate(): Observable<any> {
    return this.httpClient.get(routes.swResetZigate).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getZigateErasePDM(): Observable<any> {
    return this.httpClient.get(routes.zigateErasePDM).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getReloadPlugin(plugin: Plugin, domoticzEnv: DomoticzEnv): Observable<any> {
    const route =
      domoticzEnv.proto +
      '://' +
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

    return this.httpClient
      .disableApiPrefix()
      .get(route)
      .pipe(
        map((body: any) => body),
        catchError(() => of('Error, could not load json from api'))
      );
  }

  getRestartNeeded(): Observable<any> {
    return this.httpClient.get(routes.restartNeeded).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }

  getDomoticzEnv(): Observable<DomoticzEnv> {
    return this.httpClient.get(routes.domoticzEnv).pipe(
      map((body: any) => body),
      catchError(() => of('Error, could not load json from api'))
    );
  }
}
