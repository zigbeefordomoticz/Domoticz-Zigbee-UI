import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import {
  TopologyScan,
  TopologyScanCoverage,
  TopologyScanSummary,
  TopologyTable
} from '@app/shared/models/topology-scan';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { MeshDeviceType, resolveDeviceType } from './mesh-device-type';

/**
 * The mesh graph page: the `/topology-scan` report picker, the scan coverage
 * banner, and the graph itself.
 *
 * It has its own picker rather than reusing the Topology page's. The two
 * endpoints address a scan differently — `/topology-scan` by integer seconds,
 * `/topologie` by whatever its backend used as a key, which on zigpy is a
 * `repr()` of `time.time()` — so a selection cannot be shared between them
 * without guessing. The Topology page and its two charts are untouched.
 */
@Component({
  selector: 'app-mesh',
  templateUrl: './mesh.component.html',
  styleUrls: ['./mesh.component.scss'],
  standalone: false
})
export class MeshComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  /** Newest first, which is the reverse of what the endpoint sends. */
  scans: TopologyScanSummary[] = [];
  selected: TopologyScanSummary;
  scan: TopologyScan;

  /**
   * What each node is, by nwkid, for the graph's node icons.
   *
   * `/topology-scan` does not carry a device's ZDeviceID, so it is joined in
   * from `/zdevice`. Like the `health`, `model`, `lqi`, `rssi` and `battery`
   * the scan itself repeats, this is the device's value *now* rather than as
   * of the scan — which for what a device *is* is the stabler of the two.
   *
   * A device the plugin has no descriptor for is simply absent from the map,
   * and so is every device if the call fails: the graph then draws the nodes
   * it has always drawn, without icons.
   */
  deviceTypes = new Map<string, MeshDeviceType>();

  loadingScans = false;
  loadingScan = false;
  confirmDeleteAll = false;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadScans(true);
    this.loadDeviceTypes();
  }

  /** Join `/zdevice` for the ZDeviceID of every device, the coordinator included. */
  private loadDeviceTypes(): void {
    this.subs.sink = this.apiService.getZDevices(true).subscribe({
      next: devices => {
        const types = new Map<string, MeshDeviceType>();
        (devices ?? []).forEach(device => {
          const type = resolveDeviceType({
            nwkid: device._NwkId,
            zdeviceId: device.ZDeviceID,
            profileId: device.ProfileID
          });
          if (type) {
            types.set(device._NwkId, type);
          }
        });
        // A new Map rather than a mutated one, so the graph's @Input sees it.
        this.deviceTypes = types;
        this.cdr.detectChanges();
      },
      error: () => {
        // Nothing to do: no icons is a supported state of the graph, and
        // ApiService has already reported the failure.
      }
    });
  }

  /** Reload the report list. `autoSelect` opens the newest scan, as on arrival. */
  loadScans(autoSelect = false): void {
    this.loadingScans = true;
    this.confirmDeleteAll = false;
    this.subs.sink = this.apiService.getTopologyScans().subscribe({
      next: scans => {
        // The endpoint answers oldest first; the newest report is the one
        // somebody arriving on this page wants.
        this.scans = [...(scans ?? [])].sort((a, b) => b.timestamp - a.timestamp);
        this.loadingScans = false;

        if (this.selected && !this.scans.some(scan => scan.timestamp === this.selected.timestamp)) {
          this.selected = undefined;
          this.scan = undefined;
        }
        if (autoSelect && !this.selected && this.scans.length) {
          this.select(this.scans[0]);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingScans = false;
        this.cdr.detectChanges();
      }
    });
  }

  select(summary: TopologyScanSummary): void {
    this.selected = summary;
    this.loadingScan = true;
    // The scan already on screen stays until the new one arrives, so the graph
    // component is not destroyed and recreated between two scans — that would
    // reset the filters the user has just set.
    this.cdr.detectChanges();

    // One call for nodes, neighbours and routes: three calls would be three
    // round trips and three chances to draw a half-built graph.
    this.subs.sink = this.apiService.getTopologyScan(summary.timestamp).subscribe({
      next: scan => {
        this.scan = scan;
        this.loadingScan = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // A scan that cannot be fetched must not leave the previous one on
        // screen under the new selection.
        this.scan = undefined;
        this.loadingScan = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteScan(summary: TopologyScanSummary): void {
    this.subs.sink = this.apiService.deleteTopologyScan(summary.timestamp).subscribe(() => {
      this.toastr.success(this.translate.instant('network.mesh.deleted'));
      this.loadScans();
    });
  }

  deleteAllScans(): void {
    this.subs.sink = this.apiService.deleteTopologyScans().subscribe(() => {
      this.toastr.success(this.translate.instant('network.mesh.deleted.all'));
      this.selected = undefined;
      this.scan = undefined;
      this.loadScans();
    });
  }

  /**
   * `answered < requested`: the graph only shows the part of the mesh that
   * answered. Asked of a listing entry and of a whole scan alike, which share
   * nothing but this object.
   */
  isIncomplete(scan: { scan: TopologyScanCoverage }): boolean {
    return !!scan?.scan && scan.scan.answered < scan.scan.requested;
  }

  /** A table the scan's backend cannot collect at all, as opposed to one that came back empty. */
  collects(table: TopologyTable): boolean {
    return !!this.scan?.tables?.includes(table);
  }
}
