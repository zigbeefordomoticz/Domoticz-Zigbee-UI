import { Setting, Settings } from '@app/shared/models/setting';

// MatchingNwkId: the devices to log, "ffff" for all (LoggingManagement.loggingWriteDebug on stable9)
export const ALL_DEVICES = 'ffff';

/** What /setting-debug says in short, for the key figure on top of the Tools pages. */
export interface DebugState {
  // Modules that write debug messages, counted as on the Debug tab
  on: number;
  atDefaults: boolean;
  // Devices the messages are limited to; 0 = all
  devices: number;
}

export function debugSettings(themes: Settings[]): Setting[] {
  return (themes ?? []).flatMap(theme => theme.ListOfSettings ?? []);
}

export function currentValue(setting: Setting): any {
  return typedValue(setting, setting.current_value !== '' ? setting.current_value : setting.default_value);
}

export function typedValue(setting: Setting, value: any): any {
  return setting.DataType === 'bool' ? value === true || value === 1 || value === '1' : value;
}

export function parseMatching(value: any): string[] {
  return String(value ?? ALL_DEVICES)
    .toLowerCase()
    .split(',')
    .map(item => item.trim())
    .filter(item => item && item !== ALL_DEVICES);
}

export function debugState(themes: Settings[]): DebugState {
  const settings = debugSettings(themes);
  const switches = settings.filter(setting => setting.DataType === 'bool');
  const matching = settings.find(setting => setting.Name === 'MatchingNwkId');
  const devices = matching ? parseMatching(currentValue(matching)).length : 0;
  return {
    on: switches.filter(setting => currentValue(setting)).length,
    atDefaults:
      devices === 0 && switches.every(setting => currentValue(setting) === typedValue(setting, setting.default_value)),
    devices
  };
}
