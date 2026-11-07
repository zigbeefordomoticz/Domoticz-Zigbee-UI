// GET /zgp-pairing: what happens while a Green Power device is being paired (plugin pairing feed)

export type ZgpWindowState = 'opened' | 'closed' | 'disabled';

export interface ZgpPairingEvent {
  Seq: number;
  // Plugin clock, epoch seconds
  Time: number;
  Event: 'window' | 'heard' | 'commissioned' | 'widgets' | 'no-widget' | 'removed';
  IEEE?: string;
  SrcId?: string;
  // window
  State?: ZgpWindowState;
  Seconds?: number;
  // heard
  Command?: string | null;
  CommandName?: string | null;
  Known?: boolean;
  WindowOpen?: boolean;
  Encrypted?: boolean;
  Proxy?: string | null;
  Rssi?: number | null;
  Lqi?: number;
  // heard: commissioning / window-closed / not-pairing / encrypted / still-pairing; commissioned: leave-pairing
  Hint?: 'commissioning' | 'window-closed' | 'not-pairing' | 'encrypted' | 'still-pairing' | 'leave-pairing' | null;
  // commissioned / widgets
  Again?: boolean;
  Model?: string;
  Widgets?: number;
}

export interface ZgpPairing {
  GreenPowerEnable: boolean;
  Channel: number | null;
  // Remaining: seconds left, from the plugin clock
  Window: { State: ZgpWindowState | null; Until: number | null; Remaining?: number };
  // Device type picked for the open window, null: automatic
  Model?: string | null;
  Seq: number;
  Events: ZgpPairingEvent[];
}

// GET /zgp-models: a Green Power device type (Conf/ZGPmodel/<Name>.json of the plugin)
export interface ZgpModel {
  Name: string;
  Description: string;
  Order: number;
  Widgets: string[];
}
