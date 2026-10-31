import { Plugin } from '@app/shared/models/plugin';

// As git abbreviates a commit, and the plugin logs it (Modules/pluginHelpers.py)
export const SHORT_COMMIT_LENGTH = 7;

export interface PluginIdentity {
  release: boolean;
  version: string | null;
  gitBranch: string | null;
  branch: string | null;
  commit: string | null;
}

/**
 * A release runs from a stable* branch (or from no git checkout at all): its version says it all.
 * Any other branch, or a detached HEAD, is known by its commit: the VERSION file there is the one
 * the branch started from, and would mislead.
 */
export function pluginIdentity(plugin: Plugin): PluginIdentity {
  const commit = plugin?.PluginCommit?.slice(0, SHORT_COMMIT_LENGTH) || null;
  const gitBranch = plugin?.PluginCommitBranch || null;
  return {
    release: !commit || (gitBranch ?? '').startsWith('stable'),
    version: plugin?.PluginVersion || null,
    gitBranch,
    branch: gitBranch || plugin?.PluginBranch || null,
    commit
  };
}

// The plugin sends the channel as a number; only its placeholder without a coordinator sends hex ("0b")
export function coordinatorChannel(coordinator: any): number | null {
  const value = coordinator?.Channel;
  const channel = typeof value === 'number' ? value : parseInt(value, 16);
  return isNaN(channel) ? null : channel;
}
