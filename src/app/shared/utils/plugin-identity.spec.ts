import { describe, expect, it } from 'vitest';
import { Plugin } from '@app/shared/models/plugin';
import { coordinatorChannel, pluginIdentity, pluginLabel } from './plugin-identity';

const plugin = (fields: Partial<Plugin>) => fields as Plugin;

describe('pluginIdentity', () => {
  it('is a release on a stable branch', () => {
    const id = pluginIdentity(
      plugin({ PluginVersion: '9.1.010', PluginCommit: '0123456789abcdef', PluginCommitBranch: 'stable9' })
    );
    expect(id).toEqual({
      release: true,
      version: '9.1.010',
      gitBranch: 'stable9',
      branch: 'stable9',
      commit: '0123456'
    });
  });

  it('is a release with no git checkout at all', () => {
    expect(pluginIdentity(plugin({ PluginVersion: '9.1.010', PluginBranch: 'stable9' }))).toMatchObject({
      release: true,
      commit: null,
      gitBranch: null,
      branch: 'stable9'
    });
  });

  it('is not a release on another branch, or a detached HEAD', () => {
    expect(pluginIdentity(plugin({ PluginCommit: 'abcdef012345', PluginCommitBranch: 'fix/x' })).release).toBe(false);
    expect(pluginIdentity(plugin({ PluginCommit: 'abcdef012345' })).release).toBe(false);
  });

  it('copes with no plugin answer yet', () => {
    expect(pluginIdentity(undefined as unknown as Plugin)).toEqual({
      release: true,
      version: null,
      gitBranch: null,
      branch: null,
      commit: null
    });
  });
});

describe('pluginLabel', () => {
  it('is the version of a release', () => {
    expect(
      pluginLabel(plugin({ PluginVersion: '9.1.010', PluginCommitBranch: 'stable9', PluginCommit: 'aaaaaaaa' }))
    ).toBe('9.1.010');
  });

  it('is the branch and commit off a release', () => {
    expect(
      pluginLabel(plugin({ PluginVersion: '9.1.010', PluginCommitBranch: 'fix/x', PluginCommit: 'abcdef012345' }))
    ).toBe('fix/x (abcdef0)');
  });

  it('is the commit alone on a detached HEAD', () => {
    expect(pluginLabel(plugin({ PluginCommit: 'abcdef012345' }))).toBe('abcdef0');
  });
});

describe('coordinatorChannel', () => {
  it.each([
    [{ Channel: 15 }, 15],
    [{ Channel: '0b' }, 11],
    [{ Channel: '' }, null],
    [{}, null],
    [null, null]
  ])('%j is %j', (coordinator, channel) => {
    expect(coordinatorChannel(coordinator)).toBe(channel);
  });
});
