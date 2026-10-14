import { MESH_ICONS } from './mesh-icons';

/**
 * What a node *is*, from its ZDeviceID.
 *
 * `/topology-scan` says what part a node plays in the mesh — coordinator,
 * router or end device — and nothing about what the device actually does. The
 * ZDeviceID does: it is the ZCL device identifier out of the endpoint's simple
 * descriptor, so `0x0101` is a dimmable light and `0x0402` an IAS zone. The
 * plugin keeps it per device in `ListOfDevices` and serves it on `/zdevice`,
 * which is where the graph joins it in.
 *
 * The two tables below are the plugin's own, in `Modules/zigateConsts.py`
 * (`ZHA_DEVICES` and `ZLL_DEVICES`, both from the NXP user guides they cite).
 * They are repeated rather than fetched because the plugin does not serve
 * them, and they are spelled as the plugin spells them, with two typos
 * corrected: `Dimmabe Plug` and `Colour Dimable Light`.
 *
 * **The id is read against a profile.** ZHA `0x0200` is a shade and ZLL
 * `0x0200` is a colour light, so a ZDeviceID without its ProfileID is
 * ambiguous. An absent profile is read as ZHA, which is what all but a handful
 * of devices use.
 */

/**
 * The icon families, which are coarser than the device tables on purpose.
 *
 * Fifty-odd device ids would be fifty-odd glyphs nobody can tell apart at
 * 26 pixels. What a reader needs off a mesh graph is the kind of thing a node
 * is — a light, a plug, a sensor — so the ids collapse onto these.
 */
export type MeshDeviceFamily =
  | 'light'
  | 'plug'
  | 'switch'
  | 'thermostat'
  | 'hvac'
  | 'temperature'
  | 'pressure'
  | 'flow'
  | 'illuminance'
  | 'occupancy'
  | 'covering'
  | 'lock'
  | 'security'
  | 'siren'
  | 'energy'
  | 'extender'
  | 'tool'
  | 'sensor'
  | 'bridge';

/** The glyph each family is drawn with. Keys are `MESH_ICONS` entries. */
export const MESH_FAMILY_ICONS: Record<MeshDeviceFamily, string> = {
  light: 'lightbulb',
  plug: 'plug',
  switch: 'toggle-on',
  thermostat: 'temperature-arrow-up',
  hvac: 'fan',
  temperature: 'temperature-half',
  pressure: 'gauge',
  flow: 'droplet',
  illuminance: 'sun',
  occupancy: 'person-walking',
  covering: 'window-maximize',
  lock: 'lock',
  security: 'shield-halved',
  siren: 'bell',
  energy: 'bolt',
  extender: 'tower-broadcast',
  tool: 'screwdriver-wrench',
  sensor: 'eye',
  bridge: 'house-signal'
};

/**
 * The family a coordinator falls back to.
 *
 * A coordinator's own ZDeviceID is usually absent — the plugin never asks a
 * simple descriptor of endpoint 0 — but what it is is not in doubt, so it is
 * not left as the one node on the graph without an icon.
 */
export const MESH_COORDINATOR_FAMILY: MeshDeviceFamily = 'bridge';

/** A resolved ZDeviceID: what to draw, and what to name it in the panel. */
export interface MeshDeviceType {
  /** The id as the plugin reported it, four lowercase hex digits. */
  id: string;
  /** Which table the id was read against. */
  profile: 'zha' | 'zll';
  family: MeshDeviceFamily;
  /** The Zigbee device description, in the plugin's wording. Not translated. */
  label: string;
}

/** What the plugin reports per device on `/zdevice`, reduced to what is needed here. */
export interface MeshDeviceIdentity {
  nwkid: string;
  /** May be absent, empty, or `{}` on a device whose descriptor never arrived. */
  zdeviceId?: unknown;
  profileId?: unknown;
}

type Entry = [MeshDeviceFamily, string];

/** ZigBee Home Automation, profile `0x0104`. */
const ZHA_DEVICES: Record<number, Entry> = {
  // Generic
  0x0000: ['switch', 'On/Off Switch'],
  0x0001: ['switch', 'Level Control Switch'],
  0x0002: ['plug', 'On/Off Output'],
  0x0003: ['plug', 'Level Controllable Output'],
  0x0004: ['switch', 'Scene Selector'],
  0x0005: ['tool', 'Configuration Tool'],
  0x0006: ['switch', 'Remote Control'],
  0x0007: ['tool', 'Configuration Tool'],
  0x0008: ['extender', 'Range Extender'],
  0x0009: ['plug', 'Mains Power Outlet'],
  0x000a: ['lock', 'Door Lock'],
  0x000b: ['lock', 'Door Lock Controller'],
  0x000c: ['plug', 'Smart Plug'],
  0x000d: ['energy', 'Consumption Awareness Device'],
  // Lighting
  0x0100: ['light', 'On/Off Light'],
  0x0101: ['light', 'Dimmable Light'],
  0x0102: ['light', 'Colour Dimmable Light'],
  0x0103: ['switch', 'On/Off Light Switch'],
  0x0104: ['switch', 'Dimmer Switch'],
  0x0105: ['switch', 'Colour Dimmer Switch'],
  0x0106: ['illuminance', 'Light Sensor'],
  0x0107: ['occupancy', 'Occupancy Sensor'],
  0x010c: ['light', 'White Color Temperature Light'],
  0x010d: ['light', 'Extended Color Light'],
  // Closures
  0x0200: ['covering', 'Shade'],
  0x0201: ['covering', 'Shade Controller'],
  0x0202: ['covering', 'Window Covering Device'],
  0x0203: ['covering', 'Window Covering Controller'],
  // HVAC
  0x0300: ['hvac', 'Heating/Cooling Unit'],
  0x0301: ['thermostat', 'Thermostat'],
  0x0302: ['temperature', 'Temperature Sensor'],
  0x0304: ['hvac', 'Pump'],
  0x0305: ['pressure', 'Pressure Sensor'],
  0x0306: ['flow', 'Flow Sensor'],
  // Intruder Alarm System
  0x0400: ['security', 'IAS Control and Indicating Equipment'],
  0x0401: ['security', 'IAS Ancillary Control Equipment'],
  0x0402: ['security', 'IAS Zone'],
  0x0403: ['siren', 'IAS Warning Device']
};

/** ZigBee Light Link, profile `0xC05E`. */
const ZLL_DEVICES: Record<number, Entry> = {
  0x0000: ['light', 'On/Off Light'],
  0x0010: ['plug', 'On/Off Plug'],
  0x0100: ['light', 'Dimmable Light'],
  0x0110: ['plug', 'Dimmable Plug'],
  0x0200: ['light', 'Colour Light'],
  0x0210: ['light', 'Extended Colour Light'],
  0x0220: ['light', 'Colour Temperature Light'],
  0x0800: ['switch', 'Colour Controller'],
  0x0810: ['switch', 'Colour Scene Controller'],
  0x0820: ['switch', 'Non-Colour Controller'],
  0x0830: ['switch', 'Non-Colour Scene Controller'],
  0x0840: ['bridge', 'Control Bridge'],
  0x0850: ['sensor', 'On/Off sensor']
};

/** ZigBee Light Link, the one profile that needs its own table. */
const PROFILE_ZLL = 0xc05e;

/**
 * A hex field as the plugin serves it, or `null`.
 *
 * `ZDeviceID` and `ProfileID` are strings of hex digits without an `0x`, but a
 * device whose simple descriptor never arrived carries `""` or `{}` instead —
 * the plugin initialises those fields to an empty dict — so neither the type
 * nor the length can be taken on trust.
 */
function hexField(value: unknown): number | null {
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim().replace(/^0x/i, '');
  if (!/^[0-9a-f]{1,4}$/i.test(text)) {
    return null;
  }
  return parseInt(text, 16);
}

/**
 * Resolve one device's ZDeviceID, or `undefined` when there is nothing to draw.
 *
 * An id outside the tables resolves to nothing rather than to a guess: a
 * device reporting `0x0051` is telling us something we do not have a name
 * for, and a wrong icon is worse than none.
 */
export function resolveDeviceType(identity: MeshDeviceIdentity | undefined): MeshDeviceType | undefined {
  const id = hexField(identity?.zdeviceId);
  if (id === null) {
    return undefined;
  }

  const zll = hexField(identity?.profileId) === PROFILE_ZLL;
  const entry = zll ? ZLL_DEVICES[id] : ZHA_DEVICES[id];
  if (!entry) {
    return undefined;
  }

  return {
    id: id.toString(16).padStart(4, '0'),
    profile: zll ? 'zll' : 'zha',
    family: entry[0],
    label: entry[1]
  };
}

/** Every family has a glyph, and every glyph exists. Guards a typo in the tables. */
export function familyIcon(family: MeshDeviceFamily): string {
  const icon = MESH_FAMILY_ICONS[family];
  return MESH_ICONS[icon] ? icon : '';
}
