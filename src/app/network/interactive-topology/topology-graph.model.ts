/**
 * View models for the interactive topology graph.
 *
 * These are not API responses: they are the result of joining the topology
 * report (`Relation[]`, which only carries Father / Child / DeviceType /
 * _lnkqty) with the device list (`DeviceByName[]`, which carries IEEE, NwkId,
 * Model, Health and RSSI). The REST payload alone cannot describe a node.
 */

/** A node of the mesh, after the topology report and the device list are joined. */
export interface TopologyGraphNode {
  /** Device name as the plugin reports it, or its NwkId when it has no name. */
  id: string;
  deviceType: TopologyDeviceType;
  ieee?: string;
  nwkId?: string;
  model?: string;
  health?: string;
  status?: string;
  battery?: number | string;
  /** Last LQI the coordinator recorded for this node, from the device list. */
  lqi?: number;
  /**
   * Last RSSI the coordinator measured on a frame from this node. This is a
   * node attribute, not a link attribute: the Zigbee neighbour table reports
   * LQI only, so there is no per-link RSSI to show.
   */
  rssi?: number;
}

export type TopologyDeviceType = 'Coordinator' | 'Router' | 'End Device' | 'Unknown';

/**
 * A link between two nodes. The report lists each direction separately, so the
 * two are collapsed into one link and both LQI readings are kept.
 */
export interface TopologyGraphLink {
  id: string;
  source: string;
  target: string;
  /** Best of the two directions; what the link is coloured and filtered on. */
  lqi: number;
  /**
   * LQI the source node itself reported for this link, when the report carries
   * that direction. `_lnkqty` comes out of the Father's neighbour table, so it
   * is a measurement made *by* that node, not a direction of travel.
   */
  lqiReportedBySource?: number;
  /** Same, reported by the target node. */
  lqiReportedByTarget?: number;
}

/** One row of the neighbour table shown when a node is selected. */
export interface TopologyNeighbour {
  name: string;
  lqi: number;
  deviceType: TopologyDeviceType;
  model?: string;
  health?: string;
}
