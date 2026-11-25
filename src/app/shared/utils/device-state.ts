// A battery at or below this level (%) needs attention
export const LOW_BATTERY = 15;

export type DeviceState = 'live' | 'notseen' | 'timedout' | 'notreachable' | 'unknown' | 'disabled';

/** What the state is read from: a row of /zdevice or of /zdevice-name. */
interface DeviceLike {
  Health?: string;
  Status?: string;
  ConsistencyCheck?: string;
}

/**
 * The one reading of a device's state, for every page that counts devices. A device is in one state only,
 * so the counts add up to the number of devices.
 *
 * Health values are the plugin's, compared verbatim (see health-label.pipe.ts). TimedOut is set by the
 * ForceDeviceTimedOut_afterXhours setting and replaces "Not seen last 24hours": no message either.
 */
export function deviceState(device: DeviceLike): DeviceState {
  if (device.Health === 'Disabled' || device.Status === 'notDB') {
    return 'disabled';
  }
  if (device.Status === 'Leave') {
    return 'notreachable';
  }
  return healthState(device.Health);
}

/** The state told by a Health value alone (mesh graph, group members). */
export function healthState(health: string): DeviceState {
  switch (health) {
    case 'Live':
      return 'live';
    case 'Not Reachable':
      return 'notreachable';
    case 'TimedOut':
      return 'timedout';
    case 'Not seen last 24hours':
      return 'notseen';
    case 'Disabled':
      return 'disabled';
    default:
      return 'unknown';
  }
}

/** Switched off by the user, or not in Domoticz: left out of the counts and of "Needs attention". */
export function isDisabled(device: DeviceLike): boolean {
  return deviceState(device) === 'disabled';
}

/** The plugin does not hear from it: not reachable, not seen for a while or timed out. */
export function isNotHeard(state: DeviceState): boolean {
  return state === 'notreachable' || state === 'notseen' || state === 'timedout';
}

/** Translation key of what is wrong with the pairing of a device, '' when nothing is. */
export function pairingProblem(device: DeviceLike): string {
  return device.ConsistencyCheck === 'Bad Pairing'
    ? 'device.byname.status.badpairing'
    : device.ConsistencyCheck === 'not in DZ'
      ? 'device.byname.status.notindz'
      : device.Status && device.Status !== 'inDB'
        ? 'device.byname.status.other'
        : '';
}

export interface DeviceCounts {
  // Disabled devices left out
  enabled: number;
  live: number;
  disabled: number;
}

export function countDevices(devices: DeviceLike[]): DeviceCounts {
  const states = devices.map(deviceState);
  const disabled = states.filter(state => state === 'disabled').length;
  return {
    enabled: states.length - disabled,
    live: states.filter(state => state === 'live').length,
    disabled
  };
}
