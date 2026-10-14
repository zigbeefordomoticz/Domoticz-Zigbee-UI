/**
 * The `/topology-scan` contract.
 *
 * Specified by the plugin in `docs/TopologyScanAPI.md` and implemented in
 * `Modules/topologyScan.py`. Field names and spellings are the plugin's, not
 * this application's, so a reader can check a value against that document
 * without a translation step — including `neighbor`, which is spelled without
 * a `u` inside a record while the collection is `neighbours`.
 *
 * Two rules run through the whole payload:
 *
 * - `null` means "no reading", never zero. A neighbour with `lqi: 0` was heard
 *   at LQI 0; a neighbour with `lqi: null` was not measured. Render the second
 *   as unknown, never as a measurement.
 * - the value sets below are closed in practice but must be treated as open:
 *   an unrecognised value is to be shown as it arrived, not dropped.
 */

/** Which of the plugin's three topology backends wrote a scan. */
export type TopologySource = 'zigpy' | 'topologyv2' | 'legacy';

/**
 * A collection a backend is able to fill. Listed but empty means the backend
 * asked and got nothing — a finding. Absent means it cannot collect it at all,
 * which is a reason to disable the control rather than show an empty result.
 */
export type TopologyTable = 'neighbours' | 'routes' | 'associated_devices';

/** A neighbour's relationship *to* the node that reported it. */
export type TopologyRelationship = 'parent' | 'child' | 'sibling' | 'none_of_above' | 'previous_child' | 'unknown';

export type TopologyDeviceType = 'coordinator' | 'router' | 'end_device' | 'unknown';

/** `rx_on_when_idle` and `permit_joining`. `unknown` is common and is not a failure. */
export type TopologyFlag = 'on' | 'off' | 'unknown';

export type TopologyRouteStatus =
  | 'active'
  | 'discovery_underway'
  | 'discovery_failed'
  | 'inactive'
  | 'validation_underway'
  | 'unknown';

/**
 * Why a node has, or has not, a neighbour table in this scan.
 *
 * `not_supported` is an end device, and expected. `timeout` and `not_scanned`
 * are gaps in the picture: before this field existed a node that timed out was
 * indistinguishable from a leaf with no neighbours.
 */
export type TopologyScanStatus = 'ok' | 'timeout' | 'not_supported' | 'not_scanned';

/** How much of the mesh a scan covers. `requested` is the sum of the other three. */
export interface TopologyScanCoverage {
  requested: number;
  answered: number;
  timeout: number;
  not_scanned: number;
}

/** One entry of `GET /topology-scan`: enough to label a scan without fetching it. */
export interface TopologyScanSummary {
  /** Integer seconds, and the scan's id. Multiply by 1000 for a `Date`. */
  timestamp: number;
  source: TopologySource;
  tables: TopologyTable[];
  /** Lengths of the three collections in the full scan. */
  nodes: number;
  neighbours: number;
  routes: number;
  scan: TopologyScanCoverage;
}

export interface TopologyScanNode {
  /** The node's identity within a scan, and the key `neighbours` and `routes` join on. */
  nwkid: string;
  /** Stable across rejoins and renames; `null` for a node the plugin does not know. */
  ieee: string | null;
  /** Display only, and `null` when the device has no name: fall back to `nwkid`. */
  name: string | null;
  logical_type: TopologyDeviceType;
  rx_on_when_idle: TopologyFlag;
  scan_status: TopologyScanStatus;
  /** These five are the device's values *now*, not as of the scan. */
  health: string | null;
  model: string | null;
  lqi: number | null;
  rssi: number | null;
  battery: number | string | null;
  /** This node's direct children, or `null` when the backend has no such table. */
  associated_devices: string[] | null;
}

/** One neighbour-table row, as the reporting node reported it. */
export interface TopologyScanNeighbour {
  /** The node whose neighbour table this row came from. */
  reporter: string;
  /** The node the row is about. */
  neighbor: string;
  /** `neighbor`'s relationship to `reporter`. */
  relationship: TopologyRelationship;
  /** What `reporter` believes `neighbor` is; may differ from `neighbor`'s own `logical_type`. */
  device_type: TopologyDeviceType;
  /** 0-255, measured *by* `reporter` *about* `neighbor` — not a direction of travel. */
  lqi: number | null;
  /** Unreliable in practice: a radio with no depth for a row answers with a sentinel. */
  depth: number | null;
  rx_on_when_idle: TopologyFlag;
  permit_joining: TopologyFlag;
}

/** One routing-table row. */
export interface TopologyScanRoute {
  reporter: string;
  destination: string;
  /** The node a frame for `destination` is handed to next. Equal to `destination` on a one-hop route. */
  next_hop: string;
  status: TopologyRouteStatus;
  many_to_one: boolean;
  memory_constrained: boolean;
  route_record_required: boolean;
}

/** `GET /topology-scan/<timestamp>`: everything the graph is built from. */
export interface TopologyScan {
  timestamp: number;
  source: TopologySource;
  /** The coordinator's nwkid, so the graph has a root without hardcoding one. */
  coordinator: string;
  tables: TopologyTable[];
  scan: TopologyScanCoverage;
  nodes: TopologyScanNode[];
  /** Both directions of a link are present and are not deduplicated. */
  neighbours: TopologyScanNeighbour[];
  /** `[]` on a `legacy` scan, which has no routing table — check `tables`, not the length. */
  routes: TopologyScanRoute[];
}
