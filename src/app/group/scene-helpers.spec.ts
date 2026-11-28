import { beforeEach, describe, expect, it } from 'vitest';
import { TranslateService } from '@ngx-translate/core';
import { GroupEndpoint } from '@app/shared/models/group';
import { GroupScenes, Scene, SceneMember } from '@app/shared/models/scene';
import {
  isSectionFolded,
  saveSectionFolded,
  sceneDeviceLabel,
  sceneErrorText,
  sceneMemberKey,
  sceneNeedsAttention,
  scenePending,
  sceneTone,
  sceneWorkRunning
} from './scene-helpers';

const member = (status: SceneMember['status']) => ({ status }) as SceneMember;
const scene = (fields: Partial<Scene>) => ({ members: [], synced: 0, native: 0, ...fields }) as Scene;

describe('scene state', () => {
  it('needs attention while fewer members are synced than are native', () => {
    expect(sceneNeedsAttention(scene({ synced: 1, native: 2 }))).toBe(true);
    expect(sceneNeedsAttention(scene({ synced: 2, native: 2 }))).toBe(false);
  });

  it('is pending while a member is', () => {
    expect(scenePending(scene({ members: [member('synced'), member('pending')] }))).toBe(true);
    expect(scenePending(scene({ members: [member('synced'), member('failed')] }))).toBe(false);
  });

  it.each([
    [scene({ members: [member('pending')], synced: 0, native: 1 }), 'secondary'],
    [scene({ synced: 0, native: 1 }), 'warning'],
    [scene({ synced: 1, native: 1 }), 'success']
  ])('tone %#', (value, tone) => {
    expect(sceneTone(value)).toBe(tone);
  });

  it('runs while a scan runs or a scene is pending', () => {
    const view = (fields: Partial<GroupScenes>) => ({ scenes: [], scan: null, ...fields }) as unknown as GroupScenes;
    expect(sceneWorkRunning(view({}))).toBe(false);
    expect(sceneWorkRunning(view({ scan: { running: true } as GroupScenes['scan'] }))).toBe(true);
    expect(sceneWorkRunning(view({ scenes: [scene({ members: [member('pending')] })] }))).toBe(true);
  });
});

describe('sceneErrorText', () => {
  const translate = { instant: (key: string) => 'T:' + key } as unknown as TranslateService;

  it('translates a code the plugin refuses with', () => {
    expect(sceneErrorText({ error: { error: 'NAME_DUPLICATE' } }, translate)).toBe(
      'T:group.scenes.error.NAME_DUPLICATE'
    );
  });

  it('falls back to the HTTP status for anything else', () => {
    expect(sceneErrorText({ status: 500, statusText: 'Internal Server Error', error: { error: 'X' } }, translate)).toBe(
      '500 Internal Server Error'
    );
  });
});

describe('sceneDeviceLabel', () => {
  const endpoints = new Map<string, GroupEndpoint>([
    ['00158d00-01', { widgets: ['Lamp', 'Lamp level'], deviceName: 'Bulb' } as GroupEndpoint],
    ['00158d00-02', { widgets: [], deviceName: 'Bulb' } as GroupEndpoint]
  ]);
  const device = (endpoint: string, name = '') => ({ ieee: '00158d00', endpoint, name, capability: 'native' as const });

  it('keys members as the plugin store does', () => {
    expect(sceneMemberKey('00158d00', '01')).toBe('00158d00-01');
  });

  it('prefers the widget names, then the scene name, then the device name, then the IEEE', () => {
    expect(sceneDeviceLabel(device('01', 'Scene name'), endpoints)).toBe('Lamp · Lamp level');
    expect(sceneDeviceLabel(device('02', 'Scene name'), endpoints)).toBe('Scene name');
    expect(sceneDeviceLabel(device('02'), endpoints)).toBe('Bulb');
    expect(sceneDeviceLabel(device('03'), endpoints)).toBe('00158d00');
  });
});

describe('folded sections', () => {
  beforeEach(() => localStorage.clear());

  it('are open by default and remembered once folded', () => {
    expect(isSectionFolded('members')).toBe(false);
    saveSectionFolded('members', true);
    expect(isSectionFolded('members')).toBe(true);
    saveSectionFolded('members', false);
    expect(isSectionFolded('members')).toBe(false);
    expect(localStorage.getItem('z4d.group.folded.members')).toBeNull();
  });
});
