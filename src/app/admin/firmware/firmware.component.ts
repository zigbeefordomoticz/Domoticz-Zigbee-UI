import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import {
  DevicesByManufacturer,
  Firmware,
  FirmwareManufacturer,
  FirmwareUpdate,
  FirmwareUpdateAnswer,
  OtaRequest
} from '@app/shared/models/firmware';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { defer, timer } from 'rxjs';
import { repeat, retry, tap } from 'rxjs/operators';

/**
 * How often the transfers column re-reads `/plugin-health`.
 *
 * A transfer moves by a few hundred bytes a second, so every 5 s while one is
 * queued or running is as good as a push. When nothing is, the slower pace
 * still catches a device that asks on its own (autoServeOTA).
 */
const BUSY_REFRESH = 5000;
const IDLE_REFRESH = 30000;

/** How a request can end (`Progress` of a finished one), each with its translation. */
const OUTCOMES = ['Success', 'Failed', 'Aborted', 'More', 'Timeout', 'Dropped', 'Not needed', 'Cancelled'];

/** Where a device stands against the selected firmware. */
export type DeviceOtaStatus = 'update' | 'uptodate' | 'newer' | 'unknown' | 'busy' | 'other';

export interface FirmwareDevice extends DevicesByManufacturer {
  status: DeviceOtaStatus;
  request?: OtaRequest;
}

@Component({
  selector: 'app-firmware',
  templateUrl: './firmware.component.html',
  styleUrls: ['./firmware.component.scss'],
  standalone: false
})
export class FirmwareComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  firmwaresByBrand: FirmwareManufacturer = {};
  brands: string[] = [];
  selectedBrand: string;
  selectedFirmware: Firmware;

  devices: FirmwareDevice[];
  otherDevices: FirmwareDevice[] = [];
  showOtherDevices = false;
  selected = new Set<string>();
  force = false;

  requests: OtaRequest[] = [];
  finished: OtaRequest[] = [];
  // Plugin older than the request list: only the joined footer fields exist
  legacyDevice: string;
  legacyProgress: string;
  // The plugin's clock minus the browser's (seconds): StartTime and EndTime are plugin times
  private clockOffset = 0;

  devicesModal: FirmwareDevice[];
  requestToCancel: OtaRequest;

  constructor(
    private apiService: ApiService,
    private translate: TranslateService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.apiService.getOtaFirmware().subscribe(firmwares => {
      this.firmwaresByBrand = firmwares[0] ?? {};
      this.brands = Object.keys(this.firmwaresByBrand).sort((a, b) => a.localeCompare(b));
    });

    this.subs.sink = defer(() => this.apiService.getPluginhealth())
      .pipe(
        tap(health => this.setTransfers(health)),
        repeat({ delay: () => timer(this.busy ? BUSY_REFRESH : IDLE_REFRESH) }),
        retry({ delay: IDLE_REFRESH })
      )
      .subscribe();
  }

  get busy(): boolean {
    return this.requests.length > 0 || !!this.legacyDevice;
  }

  get activeCount(): number {
    return this.requests.filter(request => request.Status === 'Active').length;
  }

  get queuedCount(): number {
    return this.requests.length - this.activeCount;
  }

  get selectedDevices(): FirmwareDevice[] {
    return (this.devices ?? []).filter(device => this.selected.has(device.Nwkid));
  }

  selectBrand(brand: string) {
    if (brand === this.selectedBrand) {
      return;
    }
    this.selectedBrand = brand;
    this.selectedFirmware = null;
    this.clearDevices();
  }

  selectFirmware(firmware: Firmware) {
    if (firmware === this.selectedFirmware) {
      return;
    }
    this.selectedFirmware = firmware;
    this.clearDevices();
    this.subs.sink = this.apiService.getDeviceByOtaFirmware(firmware.ManufCode).subscribe(devices => {
      if (firmware !== this.selectedFirmware) {
        return;
      }
      const all = (devices ?? []).map(device => this.withStatus(device, firmware));
      this.devices = all.filter(device => device.status !== 'other');
      this.otherDevices = all.filter(device => device.status === 'other');
    });
  }

  /** A transfer row selects the brand and firmware it was started with. */
  showRequest(request: OtaRequest) {
    for (const brand of this.brands) {
      const firmware = this.firmwaresByBrand[brand].find(item => item.FileName === request.FileName);
      if (firmware) {
        this.selectBrand(brand);
        this.selectFirmware(firmware);
        return;
      }
    }
  }

  selectable(device: FirmwareDevice): boolean {
    switch (device.status) {
      case 'update':
      case 'unknown':
        return true;
      case 'uptodate':
      case 'newer':
        return this.force;
      default:
        return false;
    }
  }

  toggle(device: FirmwareDevice) {
    if (this.selected.has(device.Nwkid)) {
      this.selected.delete(device.Nwkid);
    } else if (this.selectable(device)) {
      this.selected.add(device.Nwkid);
    }
  }

  setForce(force: boolean) {
    this.force = force;
    // Without force, a device that already runs this version would be refused
    this.selectedDevices
      .filter(device => !this.selectable(device))
      .forEach(device => this.selected.delete(device.Nwkid));
  }

  open(content: any) {
    this.devicesModal = this.selectedDevices;
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => this.updateFirmware(),
      () => {}
    );
  }

  updateFirmware() {
    const devicesToUpdate: FirmwareUpdate[] = this.devicesModal.map(device => {
      const deviceToUpdate = new FirmwareUpdate();
      deviceToUpdate.Brand = this.selectedBrand;
      deviceToUpdate.Ep = device.Ep;
      deviceToUpdate.FileName = this.selectedFirmware.FileName;
      deviceToUpdate.NwkId = device.Nwkid;
      deviceToUpdate.ForceUpdate = this.force;
      return deviceToUpdate;
    });

    this.apiService.putOtaFirmware(devicesToUpdate).subscribe(answer => {
      this.reportResults(answer);
      this.selected.clear();
      this.subs.sink = this.apiService.getPluginhealth().subscribe(health => this.setTransfers(health));
    });
  }

  /** Cancel a queued or running firmware update, once confirmed. */
  cancel(request: OtaRequest, content: any) {
    this.requestToCancel = request;
    this.modalService.open(content, { ariaLabelledBy: 'modal-cancel-title' }).result.then(
      () => this.cancelFirmware(request),
      () => {}
    );
  }

  isSelectedFirmware(request: OtaRequest): boolean {
    return !!this.selectedFirmware && request.FileName === this.selectedFirmware.FileName;
  }

  /** Percentage of the image requested so far, from the bytes when the plugin gives them. */
  percent(request: OtaRequest): number {
    if (request.Size > 0 && request.Offset !== undefined) {
      return Math.min(100, Math.round((request.Offset / request.Size) * 100));
    }
    const progress = parseInt(request.Progress, 10);
    return isNaN(progress) ? 0 : progress;
  }

  /** Bytes per second since the transfer began, or null before there is anything to measure. */
  speed(request: OtaRequest): number {
    if (!request.StartTime || request.Offset === undefined) {
      return null;
    }
    const elapsed = this.pluginNow() - request.StartTime;
    const bytes = request.Offset - (request.StartOffset ?? 0);
    return elapsed > 0 && bytes > 0 ? bytes / elapsed : null;
  }

  /** Seconds left at the current speed, or null. */
  timeLeft(request: OtaRequest): number {
    const speed = this.speed(request);
    return speed ? (request.Size - request.Offset) / speed : null;
  }

  kilobytes(bytes: number): string {
    return (bytes / 1024).toFixed(1);
  }

  duration(seconds: number): string {
    const minutes = Math.max(1, Math.round(seconds / 60));
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  }

  outcome(request: OtaRequest): string {
    return OUTCOMES.includes(request.Progress)
      ? this.translate.instant('admin.firmware.outcome.' + request.Progress)
      : request.Progress;
  }

  outcomeClass(request: OtaRequest): string {
    switch (request.Progress) {
      case 'Success':
        return 'text-bg-success';
      case 'Not needed':
      case 'Cancelled':
        return 'text-bg-secondary';
      default:
        return 'text-bg-danger';
    }
  }

  stateClass(request: OtaRequest): string {
    switch (request.State) {
      case 'Transfer':
        return 'text-bg-primary';
      case 'Notifying':
        return 'text-bg-info';
      case 'Waiting':
        return 'text-bg-warning';
      default:
        return 'text-bg-secondary';
    }
  }

  /** The plugin's time now, in seconds. */
  pluginNow(): number {
    return Date.now() / 1000 + this.clockOffset;
  }

  private clearDevices() {
    this.devices = null;
    this.otherDevices = [];
    this.showOtherDevices = false;
    this.selected.clear();
  }

  private setTransfers(health: any) {
    this.requests = health?.OTAupdateRequests ?? [];
    this.finished = health?.OTAupdateFinished ?? [];
    const legacy = health && !('OTAupdateRequests' in health);
    this.legacyDevice = legacy ? health.OTAupdateDevice : null;
    this.legacyProgress = legacy ? health.OTAupdateProgress : null;
    if (health?.OTAupdateTime) {
      this.clockOffset = health.OTAupdateTime - Date.now() / 1000;
    }
    if (this.devices && this.selectedFirmware) {
      this.devices = this.devices.map(device => this.withStatus(device, this.selectedFirmware));
      this.devices.filter(device => !this.selectable(device)).forEach(device => this.selected.delete(device.Nwkid));
    }
  }

  /**
   * Compare the device with the firmware, on what the device reported in its
   * last Query Next Image Request. A device that never asked, or a plugin that
   * does not report it, gives "unknown": the plugin checks it when the device
   * asks. The image type is checked first: a device being upgraded with
   * another image is not a candidate for this one either.
   */
  private withStatus(device: DevicesByManufacturer, firmware: Firmware): FirmwareDevice {
    if (device.ImageType && parseInt(device.ImageType, 16) !== parseInt(firmware.ImageType, 16)) {
      return { ...device, status: 'other' };
    }
    const request = this.requests.find(item => item.NwkId === device.Nwkid);
    if (request) {
      return { ...device, status: 'busy', request };
    }
    if (!device.ImageType) {
      return { ...device, status: 'unknown' };
    }
    if (!device.CurrentFileVersion) {
      return { ...device, status: 'unknown' };
    }
    const current = parseInt(device.CurrentFileVersion, 16);
    const offered = parseInt(firmware.Version, 16);
    const status: DeviceOtaStatus = current < offered ? 'update' : current === offered ? 'uptodate' : 'newer';
    return { ...device, status };
  }

  private cancelFirmware(request: OtaRequest) {
    this.apiService.deleteOtaFirmware(request.NwkId).subscribe(answer => {
      (answer?.Results ?? []).forEach(result => {
        const name = request.Name || result.NwkId;
        if (result.Status === 'Cancelled') {
          this.toastr.success(this.translate.instant('admin.firmware.result.cancelled', { name }));
        } else {
          this.toastr.warning(result.Reason, this.translate.instant('admin.firmware.result.notcancelled', { name }));
        }
      });
      this.subs.sink = this.apiService.getPluginhealth().subscribe(health => this.setTransfers(health));
    });
  }

  private reportResults(answer: FirmwareUpdateAnswer) {
    if (!answer?.Results) {
      this.toastr.success(this.translate.instant('admin.firmware.notify'));
      return;
    }
    answer.Results.forEach(result => {
      const device = this.devicesModal.find(item => item.Nwkid === result.NwkId);
      const name = device?.DeviceName || result.NwkId;
      if (result.Status === 'Queued') {
        this.toastr.success(this.translate.instant('admin.firmware.result.queued', { name }));
      } else {
        this.toastr.warning(result.Reason, this.translate.instant('admin.firmware.result.rejected', { name }));
      }
    });
  }
}
