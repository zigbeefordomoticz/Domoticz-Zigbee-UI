import { Component, Input } from '@angular/core';
import { GroupEndpoint } from '@app/shared/models/group';
import { SceneDevice } from '@app/shared/models/scene';
import { sceneDeviceLabel, sceneMemberKey } from './scene-helpers';

/**
 * Which devices a scene is on, as tick boxes. The form owns leftOut, the keys not ticked: a device
 * of the group that shows up while the form is open is then ticked, as in a scene on the whole group.
 * With one device there is nothing to choose.
 */
@Component({
  selector: 'app-scene-device-picker',
  templateUrl: './scene-device-picker.component.html',
  styleUrls: ['./scene-device-picker.component.scss'],
  standalone: false
})
export class SceneDevicePickerComponent {
  @Input() devices: SceneDevice[] = [];
  @Input() leftOut: Set<string> = new Set();
  // What the Groups page knows of an endpoint: the name of its widgets
  @Input() endpoints: Map<string, GroupEndpoint> = new Map();
  // What leaving a device out does here, under the boxes
  @Input() hint = '';

  key(device: SceneDevice): string {
    return sceneMemberKey(device.ieee, device.endpoint);
  }

  label(device: SceneDevice): string {
    return sceneDeviceLabel(device, this.endpoints);
  }

  toggle(device: SceneDevice): void {
    const key = this.key(device);
    if (!this.leftOut.delete(key)) {
      this.leftOut.add(key);
    }
  }
}
