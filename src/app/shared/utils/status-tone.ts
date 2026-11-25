import { Plugin } from '@app/shared/models/plugin';
import { DeviceCounts } from './device-state';
import { pluginIdentity } from './plugin-identity';

/**
 * Colour of a status dot (.dot-<tone> in theme.scss), one meaning on every page: green fine, amber attention,
 * red problem, blue in progress or informative, grey nothing to say or not known.
 */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'secondary';

/** Amber off a release (a branch or a detached HEAD) or when an update is available, else grey. */
export function pluginTone(plugin: Plugin | null | undefined): Tone {
  if (!plugin) {
    return 'secondary';
  }
  return !pluginIdentity(plugin).release || plugin.PluginUpdate ? 'warning' : 'secondary';
}

/**
 * The coordinator, with its radio, firmware and channel: the HealthFlag of /plugin-health, as the footer.
 * 1 ready, 2 starting / busy / enrollment, 3 no communication, 4 plugin startup, 0 shutdown.
 */
export function coordinatorTone(pluginHealth: { HealthFlag?: number } | null | undefined): Tone {
  switch (pluginHealth?.HealthFlag) {
    case 1:
      return 'success';
    case 2:
      return 'warning';
    case 3:
    case 0:
      return 'danger';
    case 4:
      return 'info';
    default:
      return 'secondary';
  }
}

/** Every enabled device live, or not. */
export function devicesTone(counts: DeviceCounts | null): Tone {
  return !counts ? 'secondary' : counts.live === counts.enabled ? 'success' : 'warning';
}
