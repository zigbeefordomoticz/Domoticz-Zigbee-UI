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

@Pipe({
  name: 'healthLabel',
  standalone: false
})
export class HealthLabelPipe implements PipeTransform {
  transform(value: string): string {
    return HEALTH_LABELS[value ?? ''] ?? value;
  }
}
