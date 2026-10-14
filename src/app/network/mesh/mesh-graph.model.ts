import {
  TopologyRelationship,
  TopologyScanNeighbour,
  TopologyScanNode,
  TopologyScanRoute
} from '@app/shared/models/topology-scan';

/**
 * View models for the mesh graph.
 *
 * `/topology-scan` already describes a node completely, so unlike the older
 * charts nothing here is joined against `/zdevice-name`. What these types add
 * is the one thing the payload deliberately leaves to the client: deciding
 * what a *link* is. The report carries one row per direction per table, and a
 * graph needs one drawable element per link.
 */

/**
 * The four relationship groups the graph filters and styles on.
 *
 * `relationship` has six values, and three of them answer the same question
 * for the user — "is this the tree, or just radio range". `parent` and `child`
 * are one relationship seen from its two ends, so they collapse into `tree`.
 */
export type MeshLinkKind = 'tree' | 'sibling' | 'other' | 'unknown';

/** A node of the mesh: one entry of the scan's `nodes`, plus what it is drawn as. */
export interface MeshNode extends TopologyScanNode {
  /** `name` when the device has one, else `nwkid`. Never used as a key. */
  label: string;
  /** Degree in the neighbours table, both directions counted once. */
  links: number;
}

/**
 * One drawable link between two nodes, collapsing the up-to-two neighbour rows
 * that describe it.
 *
 * `a` and `b` are the two endpoints sorted, so a link has one identity however
 * the rows arrived. The rows themselves are kept rather than merged: A and B
 * usually report different LQIs for the same radio link, and that asymmetry is
 * often how a node that hears well but is not heard gets spotted.
 */
export interface MeshLink {
  id: string;
  a: string;
  b: string;
  /** The row `a` reported about `b`, when `a` reported one. */
  aReported?: TopologyScanNeighbour;
  /** The row `b` reported about `a`, when `b` reported one. */
  bReported?: TopologyScanNeighbour;
  /**
   * Best of the readings the two ends gave, and what the link is coloured,
   * sized and filtered on. `null` when neither end measured one, which is not
   * the same as a low LQI and is drawn differently.
   */
  lqi: number | null;
  kind: MeshLinkKind;
  /** Relationships as reported, for the panel; one entry per direction present. */
  relationships: TopologyRelationship[];
  /** True when only one of the two nodes reported this link. */
  oneSided: boolean;
}

/**
 * One drawable hop of the routing tables: "to reach any of `destinations`,
 * `reporter` hands the frame to `nextHop`".
 *
 * Routing-table rows are collapsed by `(reporter, next_hop)` because a router
 * typically reaches a dozen destinations through the same neighbour, and a
 * dozen parallel arrows between the same two nodes says nothing a single one
 * does not. The rows are kept so the panel can list where each one leads.
 */
export interface MeshRouteHop {
  id: string;
  reporter: string;
  nextHop: string;
  rows: TopologyScanRoute[];
  /** True when every row of this hop is `inactive`, `discovery_failed` or unknown. */
  inactive: boolean;
}

/** A neighbour row as the node panel lists it, from the selected node's point of view. */
export interface MeshNeighbourRow {
  /** The other end of the link. */
  peer: string;
  peerLabel: string;
  /**
   * `reported` when the selected node reported this row, `heard` when another
   * node reported the selected node. The distinction matters: the LQI belongs
   * to whichever node reported it.
   */
  direction: 'reported' | 'heard';
  relationship: TopologyRelationship;
  device_type: string;
  lqi: number | null;
  depth: number | null;
  rx_on_when_idle: string;
  permit_joining: string;
}

/**
 * One parent → child edge of the Associated Devices table.
 *
 * A row of that table is a declaration and nothing else: no LQI, no
 * relationship and no depth, unlike a neighbour row. What makes it worth
 * drawing is that it is the only table that places a *sleepy* end device —
 * one that answers no scan of its own — under the router that answers for it.
 *
 * `contested` is a child two parents both claim. That is not a malformed
 * payload: it is a device that has reparented, leaving a stale entry behind in
 * its previous parent's table, and seeing it is half the reason to collect
 * this table on its own.
 */
export interface MeshChildLink {
  id: string;
  /** The node that declared the child. */
  parent: string;
  child: string;
  /** True when another node declares this child too. */
  contested: boolean;
}
