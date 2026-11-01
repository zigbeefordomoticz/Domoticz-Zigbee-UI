import { Pipe, PipeTransform } from '@angular/core';

/**
 * Plugin Health value -> translation key, for display only.
 *
 * The values are the plugin's, compared verbatim elsewhere (dashboard, mesh graph): keep sorting
 * and filtering on the raw value. "Not seen last 24hours" is historical, the delay is the
 * HealthTimeOut setting. An unknown value is returned as is, and translate prints it unchanged.
 */
const HEALTH_LABELS: { [health: string]: string } = {
  Live: 'device.health.live',
  'Not seen last 24hours': 'device.health.notseen',
  'Not Reachable': 'device.health.notreachable',
  TimedOut: 'device.health.timedout',
  Disabled: 'device.health.disabled',
  unknown: 'device.health.unknown',
  '': 'device.health.unknown'
};

// Health pill tone, one per family: classes health-success, -warning, -danger, -secondary in theme.scss
const HEALTH_TONES: { [health: string]: string } = {
  Live: 'success',
  TimedOut: 'warning',
  'Not seen last 24hours': 'warning',
  'Not Reachable': 'danger',
  Disabled: 'secondary'
};

/** Plugin Health value -> pill tone (Device Management, Details window, dashboard list). */
export function healthTone(health: string): string {
  return HEALTH_TONES[health ?? ''] ?? 'secondary';
}

@Pipe({
  name: 'healthLabel',
  standalone: false
})
export class HealthLabelPipe implements PipeTransform {
  transform(value: string): string {
    return HEALTH_LABELS[value ?? ''] ?? value;
  }
}
