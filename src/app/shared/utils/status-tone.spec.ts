import { describe, expect, it } from 'vitest';
import { Plugin } from '@app/shared/models/plugin';
import { coordinatorTone, devicesTone, pluginTone } from './status-tone';

describe('coordinatorTone', () => {
  it.each([
    [1, 'success'],
    [2, 'warning'],
    [3, 'danger'],
    [0, 'danger'],
    [4, 'info'],
    [99, 'secondary']
  ])('HealthFlag %s is %s', (flag, tone) => {
    expect(coordinatorTone({ HealthFlag: flag })).toBe(tone);
  });

  it('is secondary with no health', () => {
    expect(coordinatorTone(null)).toBe('secondary');
    expect(coordinatorTone({})).toBe('secondary');
  });
});

describe('devicesTone', () => {
  it('is secondary with no counts', () => {
    expect(devicesTone(null)).toBe('secondary');
  });

  it('is success when every enabled device is live, else warning', () => {
    expect(devicesTone({ enabled: 3, live: 3, disabled: 1 })).toBe('success');
    expect(devicesTone({ enabled: 3, live: 2, disabled: 0 })).toBe('warning');
  });
});

describe('pluginTone', () => {
  const plugin = (fields: Partial<Plugin>) => fields as Plugin;

  it('is secondary with no plugin answer', () => {
    expect(pluginTone(null)).toBe('secondary');
  });

  it('is secondary on an up-to-date release', () => {
    expect(pluginTone(plugin({ PluginVersion: '9.1.010', PluginCommitBranch: 'stable9', PluginCommit: 'abc' }))).toBe(
      'secondary'
    );
  });

  it('is warning off a release, or with an update available', () => {
    expect(pluginTone(plugin({ PluginCommitBranch: 'fix/x', PluginCommit: 'abcdef0' }))).toBe('warning');
    expect(pluginTone(plugin({ PluginVersion: '9.1.009', PluginUpdate: true } as Partial<Plugin>))).toBe('warning');
  });
});
