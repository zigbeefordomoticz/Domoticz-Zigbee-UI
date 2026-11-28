import { describe, expect, it } from 'vitest';
import { Setting, Settings } from '@app/shared/models/setting';
import { currentValue, debugSettings, debugState, parseMatching, typedValue } from './debug-state';

const setting = (Name: string, DataType: string, current_value: any, default_value: any) =>
  ({ Name, DataType, current_value, default_value }) as Setting;
const themes = (...settings: Setting[]): Settings[] => [
  { _Theme: 'a', _Order: 1, ListOfSettings: settings.slice(0, 1) },
  { _Theme: 'b', _Order: 2, ListOfSettings: settings.slice(1) }
];

describe('typedValue / currentValue', () => {
  it.each([true, 1, '1'])('reads %j as true for a bool', value => {
    expect(typedValue(setting('x', 'bool', '', 0), value)).toBe(true);
  });

  it.each([false, 0, '0', ''])('reads %j as false for a bool', value => {
    expect(typedValue(setting('x', 'bool', '', 0), value)).toBe(false);
  });

  it('leaves other types alone', () => {
    expect(typedValue(setting('x', 'str', '', ''), '1')).toBe('1');
  });

  it('uses the default when there is no current value', () => {
    expect(currentValue(setting('x', 'bool', '', 1))).toBe(true);
    expect(currentValue(setting('x', 'bool', 0, 1))).toBe(false);
  });
});

describe('parseMatching', () => {
  it.each([
    ['ffff', []],
    ['', []],
    [undefined, []],
    ['A1B2, c3d4 ,ffff', ['a1b2', 'c3d4']]
  ])('%j gives %j', (value, devices) => {
    expect(parseMatching(value)).toEqual(devices);
  });
});

describe('debugState', () => {
  it('flattens every theme', () => {
    expect(debugSettings(themes(setting('a', 'bool', 0, 0), setting('b', 'bool', 0, 0)))).toHaveLength(2);
    expect(debugSettings(null as unknown as Settings[])).toEqual([]);
  });

  it('is at defaults with everything off and all devices', () => {
    const state = debugState(
      themes(
        setting('DebugZigpy', 'bool', '', 0),
        setting('DebugOTA', 'bool', 0, 0),
        setting('MatchingNwkId', 'str', 'ffff', 'ffff')
      )
    );
    expect(state).toEqual({ on: 0, atDefaults: true, devices: 0 });
  });

  it('counts the modules on and the devices matched', () => {
    const state = debugState(
      themes(
        setting('DebugZigpy', 'bool', 1, 0),
        setting('DebugOTA', 'bool', '', 1),
        setting('MatchingNwkId', 'str', 'a1b2,c3d4', 'ffff')
      )
    );
    expect(state).toEqual({ on: 2, atDefaults: false, devices: 2 });
  });

  it('is not at defaults when limited to some devices', () => {
    const state = debugState(
      themes(setting('DebugZigpy', 'bool', 0, 0), setting('MatchingNwkId', 'str', 'a1b2', 'ffff'))
    );
    expect(state).toEqual({ on: 0, atDefaults: false, devices: 1 });
  });
});
