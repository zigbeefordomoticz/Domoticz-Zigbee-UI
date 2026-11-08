export interface Plugin {
  Address: string;
  Author: string;
  CertifiedDbVersion: string;
  Database: string;
  DomoticzBuildTime: string;
  DomoticzHash: string;
  DomoticzVersion: string;
  HardwareID: number;
  HomeFolder: string;
  Key: string;
  Language: string;
  Mode1: string;
  Mode2: string;
  Mode3: string;
  Mode4: string;
  Mode5: string;
  Mode6: string;
  Name: string;
  Password: string;
  Port: string;
  SerialPort: string;
  StartupFolder: string;
  UserDataFolder: string;
  Username: string;
  Version: string;
  WebRoot: string;
  Zigpy: boolean;
  FirmwareVersion: string;
  Coordinator: string;
  NetworkSize?: string;
  CoordinatorModel?: string;
  PluginVersion?: string;
  PluginBranch?: string;
  PluginCommit?: string | null;
  PluginCommitBranch?: string | null;
  CoordinatorFirmwareVersion?: string;
  CoordinatorIEEE?: string;
  NetworkDevices: Array<any>;
  DistributionInfos: Array<string>;
  // False when the coordinator cannot pair Green Power devices (ZNP); missing from plugins without Green Power
  GreenPowerSupported?: boolean;
}

/** Green Power pages are shown only when the plugin says its coordinator can pair Green Power devices */
export function greenPowerSupported(plugin?: Plugin | null): boolean {
  return plugin?.GreenPowerSupported === true;
}
