export interface Setting {
  DataType: string;
  Name: string;
  current_value: any;
  default_value: any;
  restart_need: boolean;
  Advanced: boolean;
}

export interface Settings {
  ListOfSettings: Array<Setting>;
  _Theme: string;
  _Order: number;
}
