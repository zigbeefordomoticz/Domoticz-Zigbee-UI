import { describe, expect, it } from 'vitest';
import { countDevices, deviceState, healthState, isDisabled, isNotHeard, pairingProblem } from './device-state';

describe('healthState', () => {
  it.each([
    ['Live', 'live'],
    ['Not Reachable', 'notreachable'],
    ['TimedOut', 'timedout'],
    ['Not seen last 24hours', 'notseen'],
    ['Disabled', 'disabled'],
    ['', 'unknown'],
    ['something else', 'unknown']
  ])('%j is %s', (health, state) => {
    expect(healthState(health)).toBe(state);
  });
});

describe('deviceState', () => {
  it('reads the Health value', () => {
    expect(deviceState({ Health: 'Live', Status: 'inDB' })).toBe('live');
  });

  it('is disabled when not in Domoticz, whatever the Health', () => {
    expect(deviceState({ Health: 'Live', Status: 'notDB' })).toBe('disabled');
  });

  it('is not reachable after a Leave', () => {
    expect(deviceState({ Health: 'Live', Status: 'Leave' })).toBe('notreachable');
  });

  it('isDisabled follows it', () => {
    expect(isDisabled({ Health: 'Disabled' })).toBe(true);
    expect(isDisabled({ Health: 'Live' })).toBe(false);
  });
});

describe('isNotHeard', () => {
  it.each([
    ['notreachable', true],
    ['notseen', true],
    ['timedout', true],
    ['live', false],
    ['disabled', false],
    ['unknown', false]
  ] as const)('%s is %s', (state, heard) => {
    expect(isNotHeard(state)).toBe(heard);
  });
});

describe('pairingProblem', () => {
  it.each([
    [{ ConsistencyCheck: 'Bad Pairing' }, 'device.byname.status.badpairing'],
    [{ ConsistencyCheck: 'not in DZ' }, 'device.byname.status.notindz'],
    [{ Status: 'Leave' }, 'device.byname.status.other'],
    [{ Status: 'inDB' }, ''],
    [{ ConsistencyCheck: 'ok', Status: 'inDB' }, ''],
    [{}, '']
  ])('%j gives %j', (device, key) => {
    expect(pairingProblem(device)).toBe(key);
  });
});

describe('countDevices', () => {
  it('leaves disabled devices out of enabled, so the counts add up', () => {
    const counts = countDevices([
      { Health: 'Live' },
      { Health: 'Live' },
      { Health: 'TimedOut' },
      { Health: 'Disabled' },
      { Health: 'Live', Status: 'notDB' }
    ]);
    expect(counts).toEqual({ enabled: 3, live: 2, disabled: 2 });
  });

  it('counts nothing in an empty list', () => {
    expect(countDevices([])).toEqual({ enabled: 0, live: 0, disabled: 0 });
  });
});
