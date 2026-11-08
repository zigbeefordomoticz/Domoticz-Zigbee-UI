export interface Setting {
  DataType: string;
  Name: string;
  list: any[];
  current_value: any;
  default_value: any;
  restart_need: boolean | number;
  Advanced: boolean;
  // Optional presentation keys from the plugin's SETTINGS (Classes/PluginConf.py); an older plugin sends none
  Group?: string;
  Unit?: string;
  Min?: number;
  Max?: number;
  Step?: number;
  DependsOn?: string;
  Danger?: boolean;
  OneShot?: boolean;
}

export interface Settings {
  ListOfSettings: Array<Setting>;
  _Theme: string;
  _Order: number;
}
