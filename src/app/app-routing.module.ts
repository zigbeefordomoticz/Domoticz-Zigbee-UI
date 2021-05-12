import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { Shell } from '@app/shell/shell.service';

const routes: Routes = [
  Shell.childRoutes([
    { path: 'about', loadChildren: () => import('app/about/about.module').then((m) => m.AboutModule) },
    { path: 'device', loadChildren: () => import('app/device/device.module').then((m) => m.DeviceModule) },
    { path: 'group', loadChildren: () => import('app/group/group.module').then((m) => m.GroupModule) },
    { path: 'network', loadChildren: () => import('app/network/network.module').then((m) => m.NetworkModule) },
    { path: 'admin', loadChildren: () => import('app/admin/admin.module').then((m) => m.AdminModule) },
    { path: 'settings', loadChildren: () => import('app/settings/settings.module').then((m) => m.SettingsModule) },
    {
      path: 'manufacturer',
      loadChildren: () => import('app/manufacturer/manufacturer.module').then((m) => m.ManufacturerModule),
    },
    { path: 'tools', loadChildren: () => import('app/tools/tools.module').then((m) => m.ToolsModule) },
  ]),
  // Fallback when no prior route is matched
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule {}
