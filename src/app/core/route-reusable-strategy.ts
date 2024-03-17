/* eslint-disable @typescript-eslint/no-unused-vars */
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
import { Injectable } from '@angular/core';

/**
 * A route strategy allowing for explicit route reuse.
 * Used as a workaround for https://github.com/angular/angular/issues/18374
 * To reuse a given route, add `data: { reuse: true }` to the route definition.
 */
@Injectable()
export class RouteReusableStrategy extends RouteReuseStrategy {
  public shouldDetach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  public store(_route: ActivatedRouteSnapshot, _detachedTree: DetachedRouteHandle | null): void {}

  public shouldAttach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  public retrieve(_route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  public shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig || future.data.reuse;
  }
}
