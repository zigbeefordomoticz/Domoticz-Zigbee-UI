import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Plugin } from '../dashboard/plugin/plugin';
import { PluginStats } from '@app/dashboard/plugin-stats/plugin-stats';
import { Device } from '@app/shared/models/device';
import { Setting } from '@app/settings/setting';
import { DevicesAvailable } from '@app/group/group';

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
  reqInter: '/req-nwk-inter'
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private httpClient: HttpClient) {}

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
}
