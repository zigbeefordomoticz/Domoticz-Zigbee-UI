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

/**
 * A ZDeviceID as reported, resolved as far as it can be.
 *
 * `family` and `label` are absent when neither table names the id. That is not
 * the same as a device that reported nothing at all, and the panel must not
 * say it is: an id we have no name for is a finding — it is how the Green
 * Power endpoint overwriting a device's own descriptor shows up — and the raw
 * value is the only thing that makes it visible.
 */
export interface MeshDeviceType {
  /** The id as the plugin reported it, four lowercase hex digits. */
  id: string;
  /** The profile as reported, four lowercase hex digits, or `''` when absent. */
  profileId: string;
  /** Which table named the id, when one did. */
  profile?: 'zha' | 'zll';
  /** The endpoint the id came from, when it was not the device's global field. */
  endpoint?: string;
  family?: MeshDeviceFamily;
  /** The Zigbee device description, in the plugin's wording. Not translated. */
  label?: string;
}

/** What the plugin keeps per device, reduced to what is needed here. */
export interface MeshDeviceIdentity {
  nwkid: string;
  /** May be absent, empty, or `{}` on a device whose descriptor never arrived. */
  zdeviceId?: unknown;
  profileId?: unknown;
  /**
   * `Epv2`: endpoint → `{ ProfileID, ZDeviceID, ... }`, as the plugin records
   * each simple descriptor. This is the reliable half — see `candidates()`.
   */
  endpoints?: unknown;
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
  // The plugin's own table, from the NXP guide, calls 0x000c a smart plug.
  // The current ZCL device list — and zigpy — call it a simple sensor, which
  // is what reports it in practice: a Hue dimmer, for one.
  0x000c: ['sensor', 'Simple Sensor'],
  0x000d: ['energy', 'Consumption Awareness Device'],
  // The rest of the generic range, which the NXP guide predates.
  0x0050: ['bridge', 'Home Gateway'],
  0x0051: ['plug', 'Smart Plug'],
  0x0052: ['plug', 'White Goods'],
  0x0053: ['energy', 'Meter Interface'],
  // Lighting
  0x0100: ['light', 'On/Off Light'],
  0x0101: ['light', 'Dimmable Light'],
  0x0102: ['light', 'Colour Dimmable Light'],
  0x0103: ['switch', 'On/Off Light Switch'],
  0x0104: ['switch', 'Dimmer Switch'],
  0x0105: ['switch', 'Colour Dimmer Switch'],
  0x0106: ['illuminance', 'Light Sensor'],
  0x0107: ['occupancy', 'Occupancy Sensor'],
  0x0108: ['light', 'On/Off Ballast'],
  0x0109: ['light', 'Dimmable Ballast'],
  0x010a: ['plug', 'On/Off Plug-in Unit'],
  0x010b: ['plug', 'Dimmable Plug-in Unit'],
  0x010c: ['light', 'White Color Temperature Light'],
  0x010d: ['light', 'Extended Color Light'],
  0x010e: ['illuminance', 'Light Level Sensor'],
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

/** ZigBee Home Automation, and ZigBee Light Link: the two profiles with a table. */
const PROFILE_ZHA = 0x0104;
const PROFILE_ZLL = 0xc05e;

/**
 * ZigBee Green Power, whose endpoint is the reason this file reads `Epv2` at
 * all.
 *
 * The plugin writes the global `ZDeviceID` and `ProfileID` on every simple
 * descriptor it decodes, so they end up holding whichever endpoint answered
 * last — and on a mains-powered device that is usually endpoint `f2`, the
 * Green Power proxy, which reports profile `0xa1e0` and device id `0x0061`.
 * A Hue bulb then says "Green Power proxy" rather than "extended colour
 * light". Its own endpoint still says the truth, so that is what is read.
 */
const PROFILE_GREEN_POWER = 0xa1e0;

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

/** One (device id, profile) pair a device reported, and where it reported it. */
interface Candidate {
  id: number;
  profileId: number | null;
  /** The endpoint it came from; absent for the device's global fields. */
  endpoint?: string;
}

/**
 * Every id a device reported, best first.
 *
 * The global fields come first because they are what the device settled on,
 * then each endpoint in order. Green Power is dropped wherever it appears: it
 * is never what a reader means by "what is this device", and on most
 * mains-powered devices it is exactly what the global field holds.
 */
function candidates(identity: MeshDeviceIdentity | undefined): Candidate[] {
  const list: Candidate[] = [];

  const globalId = hexField(identity?.zdeviceId);
  if (globalId !== null) {
    list.push({ id: globalId, profileId: hexField(identity?.profileId) });
  }

  const endpoints = identity?.endpoints;
  if (endpoints && typeof endpoints === 'object') {
    Object.keys(endpoints as Record<string, unknown>)
      .sort()
      .forEach(endpoint => {
        const content = (endpoints as Record<string, unknown>)[endpoint];
        if (!content || typeof content !== 'object') {
          return;
        }
        const id = hexField((content as Record<string, unknown>).ZDeviceID);
        if (id !== null) {
          list.push({ id, profileId: hexField((content as Record<string, unknown>).ProfileID), endpoint });
        }
      });
  }

  return list.filter(candidate => candidate.profileId !== PROFILE_GREEN_POWER);
}

/** The table a candidate's profile points at, and the other one as a fallback. */
function lookup(candidate: Candidate): ['zha' | 'zll', Entry] | undefined {
  const zll = candidate.profileId === PROFILE_ZLL;
  const order: Array<['zha' | 'zll', Record<number, Entry>]> = zll
    ? [
        ['zll', ZLL_DEVICES],
        ['zha', ZHA_DEVICES]
      ]
    : [
        ['zha', ZHA_DEVICES],
        ['zll', ZLL_DEVICES]
      ];

  for (const [profile, table] of order) {
    if (table[candidate.id]) {
      return [profile, table[candidate.id]];
    }
  }
  return undefined;
}

/** True for a profile a table was written for, as opposed to a vendor's own. */
function namedProfile(profileId: number | null): boolean {
  return profileId === PROFILE_ZHA || profileId === PROFILE_ZLL;
}

/**
 * Resolve one device's ZDeviceID. `undefined` only when it reported none at
 * all, anywhere.
 *
 * The candidate that wins is the first that a table names, preferring one
 * reported under a profile the tables were written for: Develco's plugs carry
 * their real descriptor on endpoint `02` under profile `0x0104` while their
 * global fields hold endpoint `01`'s proprietary `0xc0c9` profile, where the
 * same id means something else entirely.
 *
 * The profile also decides which table is read first, because ZHA `0x0200` is
 * a shade and ZLL `0x0200` is a colour light. The other table is then tried,
 * which costs nothing — the first has already said it does not know the id —
 * and catches the devices reporting a ZLL controller id under profile
 * `0x0104`, as IKEA's remotes do.
 *
 * An id in neither table draws no icon rather than a guess, but it is still
 * returned: a device reporting `0x0061` is telling us something, and the
 * panel shows it as it arrived.
 */
export function resolveDeviceType(identity: MeshDeviceIdentity | undefined): MeshDeviceType | undefined {
  const reported = candidates(identity);
  if (!reported.length) {
    return undefined;
  }

  const named = reported.filter(candidate => namedProfile(candidate.profileId));
  const ranked = [...named, ...reported.filter(candidate => !namedProfile(candidate.profileId))];

  const chosen = ranked.find(candidate => lookup(candidate)) ?? ranked[0];
  const match = lookup(chosen);

  const type: MeshDeviceType = {
    id: chosen.id.toString(16).padStart(4, '0'),
    profileId: chosen.profileId === null ? '' : chosen.profileId.toString(16).padStart(4, '0')
  };
  if (chosen.endpoint) {
    type.endpoint = chosen.endpoint;
  }
  if (match) {
    type.profile = match[0];
    type.family = match[1][0];
    type.label = match[1][1];
  }

  return type;
}

/** Every family has a glyph, and every glyph exists. Guards a typo in the tables. */
export function familyIcon(family: MeshDeviceFamily): string {
  const icon = MESH_FAMILY_ICONS[family];
  return MESH_ICONS[icon] ? icon : '';
}
