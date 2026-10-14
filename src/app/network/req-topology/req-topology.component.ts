import { Component, Input } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { VersionService } from '@app/services/version-service';
import { PluginStats } from '@app/shared/models/plugin-stats';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-req-topology',
  templateUrl: './req-topology.component.html',
  styleUrls: ['./req-topology.component.scss'],
  standalone: false
})
export class ReqTopologyComponent {
  stats$: Observable<PluginStats>;

  /**
   * Whether to offer the Associated Devices collection beside the full scan.
   *
   * Off by default, because the two older charts on the Topology page read
   * `/topologie`, which a standalone collection never writes to: the button
   * would start a scan whose result that page cannot show. The Mesh graph
   * page reads `/topology-scan`, which files it as a scan of its own, and
   * turns it on.
   */
  @Input() associatedDevices = false;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private versionService: VersionService
  ) {}

  reqTopology() {
    this.apiService.getReqTopologie().subscribe(() => {
      this.toastr.success(this.translate.instant('api.global.succes.scanlaunched.notify'));
      // Refresh the footer now rather than at the next navigation, so the
      // scan indicator appears when the scan does.
      this.versionService.setReload(true);
    });
  }

  /**
   * Collect each router's children, without a full topology scan.
   *
   * A refusal — not a zigpy coordinator, the report setting off, or a scan
   * already running — arrives as a `400` carrying the plugin's own wording,
   * which `ApiService` shows. So there is nothing to report here but the
   * success case.
   */
  reqAssociatedDevices() {
    this.apiService.getReqTopologyAssociatedDevices().subscribe(() => {
      this.toastr.success(this.translate.instant('network.topology.req.associated.launched'));
      this.versionService.setReload(true);
    });
  }
}
