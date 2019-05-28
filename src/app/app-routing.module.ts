import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { Shell } from '@app/shell/shell.service';

const routes: Routes = [
  Shell.childRoutes([
    { path: 'about', loadChildren: 'app/about/about.module#AboutModule' },
    { path: 'device', loadChildren: 'app/device/device.module#DeviceModule' },
    { path: 'group', loadChildren: 'app/group/group.module#GroupModule' },
    { path: 'network', loadChildren: 'app/network/network.module#NetworkModule' },
    { path: 'admin', loadChildren: 'app/admin/admin.module#AdminModule' },
    { path: 'settings', loadChildren: 'app/settings/settings.module#SettingsModule' }
  ]),
  // Fallback when no prior route is matched
  { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule {}
