import { Component, OnInit } from '@angular/core';
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { FirmwareAvailable, firmwareAvailableRows, isDownloadUrl } from '@app/shared/models/firmware';

interface FirmwareUpdateRow {
  name: string;
  nwkid: string;
  model: string;
  manufacturer: string;
  type: string;
  installed: string;
  newest: string;
  url?: string;
  file?: string;
}

/** A plugin version (decimal string) as the Firmware page shows them: 0x and 8 hex digits */
function hexVersion(value: string): string {
  return /^\d+$/.test(value ?? '') ? '0x' + Number(value).toString(16).toUpperCase().padStart(8, '0') : value || '—';
}

function hexType(value: number | string): string {
  const type = typeof value === 'number' ? value : /^\d+$/.test(String(value)) ? Number(value) : NaN;
  return Number.isNaN(type) ? String(value) : '0x' + type.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Admin > Firmware > Updates found online, opened from the dashboard's "Firmware update
 * available": the newer firmware the plugin found in the online OTA index for each device, where
 * to download it, and what to do with the file. The plugin never downloads firmware itself.
 *
 * The download links stay disabled until the reader accepts the warning, on each visit.
 */
@Component({
  selector: 'app-firmware-updates',
  templateUrl: './firmware-updates.component.html',
  styleUrls: ['./firmware-updates.component.scss'],
  standalone: false
})
export class FirmwareUpdatesComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  rows: FirmwareUpdateRow[] = [];
  loading = true;
  accepted = false;

  constructor(private apiService: ApiService) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.apiService.getOtaFirmwareAvailable().subscribe({
      next: (list: FirmwareAvailable[]) => {
        this.rows = firmwareAvailableRows(list)
          .map(fw => this.row(fw))
          .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name));
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  private row(fw: FirmwareAvailable): FirmwareUpdateRow {
    const url = isDownloadUrl(fw.url) ? fw.url : undefined;
    return {
      name: fw.zdevicename || fw.nwkid,
      nwkid: fw.nwkid,
      model: fw.model && fw.model !== 'Unknown' ? fw.model : '—',
      manufacturer: fw.manufacturername && fw.manufacturername !== 'Unknown' ? fw.manufacturername : '—',
      type: hexType(fw.fwtype),
      installed: hexVersion(fw.currentversion),
      newest: hexVersion(fw.newestversion),
      url,
      file: url ? decodeURIComponent(url.split('?')[0].split('/').pop() || '') : undefined
    };
  }
}
