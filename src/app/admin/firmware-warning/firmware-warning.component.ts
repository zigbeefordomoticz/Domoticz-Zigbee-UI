import { Component } from '@angular/core';

/**
 * The warning shown wherever firmware is downloaded or sent to a device: firmware comes from the
 * device's manufacturer, an update can leave a device unusable, and Zigbee for Domoticz takes no
 * responsibility for it. Content projected inside (an acknowledgement, a link) goes under the text.
 */
@Component({
  selector: 'app-firmware-warning',
  templateUrl: './firmware-warning.component.html',
  styleUrls: ['./firmware-warning.component.scss'],
  standalone: false
})
export class FirmwareWarningComponent {}
