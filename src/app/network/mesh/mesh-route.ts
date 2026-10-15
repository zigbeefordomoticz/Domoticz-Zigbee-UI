import {
  TopologyScan,
  TopologyScanNeighbour,
  TopologyScanRoute,
  TopologyRouteStatus
} from '@app/shared/models/topology-scan';

/**
 * Working out the path a frame takes between two nodes, from one scan.
 *
 * Two sources of truth, and they are not equal:
 *
 * - **the routing tables**, which are what the radios actually decided. A row
 *   gives one hop — "for this destination, hand the frame to that neighbour" —
 *   so a whole path is assembled by reading the next hop's table in turn. This
 *   is a reconstruction of a real decision.
 * - **the neighbour tables**, which give only who can hear whom, at what LQI.
 *   Turning LQI into a link cost and running Dijkstra reproduces what Zigbee's
 *   route discovery would choose. This is a *prediction*, not an observation.
 *
 * The path returned follows the tables as far as they go and estimates the
 * rest, tagging every hop with which of the two produced it, because the
 * distinction is the whole truthfulness of the answer. A path is a computed
 * answer about a snapshot either way: see `MeshPath.outcome` and the warning
 * the UI prints beside it.
 *
 * Nothing here touches Angular or the DOM, so the algorithm can be read, and
 * checked against a captured report, on its own.
 */

/** Zigbee caps a link cost at 7 (nwkcMaxLinkCost). */
export const MAX_LINK_COST = 7;

/** Hops to follow before deciding the tables are pointing in a circle. */
const MAX_HOPS = 16;

/** Where one hop of a path came from. */
export type MeshHopSource =
  /** The destination was in this node's neighbour table: delivered in one hop. */
  | 'direct'
  /** An active routing-table row named this next hop. */
  | 'table'
  /** No usable row; this hop is the LQI estimate's choice. */
  | 'estimate'
  /** Last hop to a sleepy end device, which is always through its parent. */
  | 'parent';

/** How much of a path is observation and how much is prediction. */
export type MeshPathOutcome =
  /** Every hop came from a routing table (or was a direct neighbour). */
  | 'tables'
  /** The tables ran out part way and the rest is estimated. */
  | 'hybrid'
  /** No usable routing row at all: the whole path is the LQI estimate. */
  | 'estimate'
  /** Source and destination are the same node. */
  | 'same'
  /** The two nodes are not connected by anything this scan reports. */
  | 'unreachable'
  /** The routing tables point in a circle, or the path never terminates. */
  | 'loop';

export interface MeshHop {
  from: string;
  to: string;
  source: MeshHopSource;
  /** Best LQI reported for this pair, when the two are neighbours at all. */
  lqi: number | null;
  /** The cost the estimate puts on this link; `null` when the pair is not a neighbour pair. */
  cost: number | null;
  /** The routing row's status, on a hop that came from a table. */
  status?: TopologyRouteStatus;
}

export interface MeshPath {
  source: string;
  destination: string;
  outcome: MeshPathOutcome;
  hops: MeshHop[];
  /** Hops taken from a routing table, including the direct and parent ones. */
  observedHops: number;
  /** Hops the LQI estimate supplied. */
  estimatedHops: number;
  /**
   * Summed link cost over the hops that have one.
   *
   * Comparable between two paths of the same scan and meaningless on its own;
   * a hop from a routing table whose pair is not in any neighbour table
   * contributes nothing, so this is a floor rather than a total.
   */
  cost: number | null;
  /**
   * True when the destination is reached through a concentrator mechanism the
   * scan cannot read. Routes toward a many-to-one concentrator live in route
   * records held by the concentrator, not in the per-destination rows a
   * topology scan collects, so the estimate is all there can be.
   */
  manyToOne: boolean;
}

interface MeshEdge {
  cost: number;
  lqi: number | null;
}

/** The three tables of a scan, indexed for path finding. */
export interface MeshRouteGraph {
  /** Neighbour adjacency, undirected, with the *worse* of the two directions' cost. */
  adjacency: Map<string, Map<string, MeshEdge>>;
  /** reporter -> destination -> the routing row. */
  routes: Map<string, Map<string, TopologyScanRoute>>;
  /** child -> the node that declared it, from the Associated Devices table. */
  parents: Map<string, string>;
  coordinator: string;
  /** True when any routing row is flagged many-to-one. */
  hasManyToOne: boolean;
}

/**
 * Zigbee's link cost from a link's delivery probability: `min(7, 1/p⁴)`.
 *
 * `p` is estimated as `lqi / 255`, which is the part no specification fixes.
 * Every stack maps LQI to a probability its own way — Silicon Labs, TI and NXP
 * all differ, and NXP's published table treats LQI 51 as a cost of 1 where
 * this curve would call it 7 — so this is a reasonable default and not a
 * measurement. On a real mesh the curve behaves close to a two-way split:
 * roughly a third of links land on cost 1, well over half saturate at 7, and
 * little sits in between. That is still enough for the estimate to prefer good
 * links, but it means equal-cost paths are common, which is why `dijkstra()`
 * breaks ties on hop count.
 *
 * A link with no reading at all costs the maximum: it is not evidence of a bad
 * link, but a path through a link nobody measured is the one to prefer least.
 */
export function linkCost(lqi: number | null): number {
  if (lqi === null || lqi === undefined) {
    return MAX_LINK_COST;
  }
  const p = Math.max(lqi / 255, 0.01);
  return Math.min(MAX_LINK_COST, Math.round(1 / Math.pow(p, 4)));
}

/**
 * Index a scan for path finding.
 *
 * The neighbour graph is undirected and keeps the *worse* of the two
 * directions, which is what a Zigbee stack does with its own link status
 * exchange: a link is only as good as its weaker half, and a path over it has
 * to survive both.
 */
export function buildRouteGraph(scan: TopologyScan): MeshRouteGraph {
  const adjacency = new Map<string, Map<string, MeshEdge>>();
  const routes = new Map<string, Map<string, TopologyScanRoute>>();
  const parents = new Map<string, string>();

  const connect = (from: string, to: string, row: TopologyScanNeighbour): void => {
    if (from === to) {
      return;
    }
    const edges = adjacency.get(from) ?? new Map<string, MeshEdge>();
    const existing = edges.get(to);
    const cost = linkCost(row.lqi);
    // Worse cost wins; the LQI kept beside it is the better reading, which is
    // the one the link is drawn and labelled with elsewhere.
    const lqi =
      existing?.lqi === null || existing?.lqi === undefined
        ? row.lqi
        : row.lqi === null
          ? existing.lqi
          : Math.max(existing.lqi, row.lqi);
    edges.set(to, { cost: existing ? Math.max(existing.cost, cost) : cost, lqi });
    adjacency.set(from, edges);
  };

  (scan.neighbours ?? []).forEach(row => {
    connect(row.reporter, row.neighbor, row);
    connect(row.neighbor, row.reporter, row);
  });

  (scan.routes ?? []).forEach(row => {
    const byDestination = routes.get(row.reporter) ?? new Map<string, TopologyScanRoute>();
    const existing = byDestination.get(row.destination);
    // An active row beats a row in any other state for the same destination.
    if (!existing || (existing.status !== 'active' && row.status === 'active')) {
      byDestination.set(row.destination, row);
    }
    routes.set(row.reporter, byDestination);
  });

  (scan.nodes ?? []).forEach(node => {
    (node.associated_devices ?? []).forEach(child => {
      if (child !== node.nwkid && !parents.has(child)) {
        // First parent wins. A child two parents claim has reparented, and the
        // stale entry is as likely to be first as the live one — which is one
        // more reason a path to a sleepy device is an estimate.
        parents.set(child, node.nwkid);
      }
    });
  });

  return {
    adjacency,
    routes,
    parents,
    coordinator: scan.coordinator,
    hasManyToOne: (scan.routes ?? []).some(row => row.many_to_one)
  };
}

/**
 * The path a frame from `source` would take to `destination`.
 *
 * Follows active routing rows while there are any, and finishes with the LQI
 * estimate wherever the chain breaks. The rules, in the order they are tried
 * at each node:
 *
 * 1. already at the destination — done;
 * 2. the destination is in this node's neighbour table — delivered directly;
 * 3. the destination is a child of this node — the parent answers for it;
 * 4. an *active* routing row names a next hop — follow it;
 * 5. otherwise the chain has broken: estimate the remainder.
 *
 * A row in `discovery_underway`, `validation_underway` or `inactive` is not
 * followed. It is not a decision the radio has committed to, and treating it
 * as one would present a route that may never exist as an observation.
 */
export function computePath(graph: MeshRouteGraph, source: string, destination: string): MeshPath {
  const empty = (outcome: MeshPathOutcome, hops: MeshHop[] = []): MeshPath =>
    summarise(source, destination, outcome, hops, graph);

  if (!source || !destination) {
    return empty('unreachable');
  }
  if (source === destination) {
    return empty('same');
  }

  const hops: MeshHop[] = [];
  const seen = new Set<string>([source]);
  let current = source;

  for (let step = 0; step < MAX_HOPS; step++) {
    if (graph.adjacency.get(current)?.has(destination)) {
      hops.push(hop(graph, current, destination, 'direct'));
      return summarise(source, destination, outcomeOf(hops), hops, graph);
    }
    if (graph.parents.get(destination) === current) {
      hops.push(hop(graph, current, destination, 'parent'));
      return summarise(source, destination, outcomeOf(hops), hops, graph);
    }

    const row = graph.routes.get(current)?.get(destination);
    if (row && row.status === 'active') {
      if (seen.has(row.next_hop)) {
        return summarise(source, destination, 'loop', hops, graph);
      }
      hops.push({ ...hop(graph, current, row.next_hop, 'table'), status: row.status });
      seen.add(row.next_hop);
      current = row.next_hop;
      continue;
    }

    // The tables have run out. Estimate the rest — to the destination itself
    // when it has links of its own, else to the parent that answers for it.
    const reachable = graph.adjacency.has(destination);
    const target = reachable ? destination : (graph.parents.get(destination) ?? destination);
    const estimate = dijkstra(graph, current, target);
    if (!estimate) {
      return summarise(source, destination, 'unreachable', hops, graph);
    }
    estimate.forEach(edge => hops.push({ ...edge, source: 'estimate' }));
    if (target !== destination) {
      hops.push(hop(graph, target, destination, 'parent'));
    }
    return summarise(source, destination, outcomeOf(hops), hops, graph);
  }

  return summarise(source, destination, 'loop', hops, graph);
}

/**
 * The path from one node to each of several destinations.
 *
 * What the coordinator's view is built from: asked of the coordinator, the
 * question is not "how does it reach this one device" but "how does it reach
 * everything", and that is one path per node rather than a different
 * algorithm.
 *
 * Destinations that are the source itself, or that nothing connects, are left
 * out: a list of unreachable nodes belongs in the scan's coverage banner, not
 * in a route view.
 */
export function computePathsFrom(graph: MeshRouteGraph, source: string, destinations: string[]): MeshPath[] {
  return destinations
    .filter(destination => destination !== source)
    .map(destination => computePath(graph, source, destination))
    .filter(path => path.hops.length > 0);
}

/** One hop, with whatever the neighbour tables know about that pair. */
function hop(graph: MeshRouteGraph, from: string, to: string, origin: MeshHopSource): MeshHop {
  const edge = graph.adjacency.get(from)?.get(to);
  return { from, to, source: origin, lqi: edge?.lqi ?? null, cost: edge?.cost ?? null };
}

function outcomeOf(hops: MeshHop[]): MeshPathOutcome {
  const estimated = hops.filter(step => step.source === 'estimate').length;
  if (!estimated) {
    return 'tables';
  }
  return estimated === hops.length ? 'estimate' : 'hybrid';
}

function summarise(
  source: string,
  destination: string,
  outcome: MeshPathOutcome,
  hops: MeshHop[],
  graph: MeshRouteGraph
): MeshPath {
  const costs = hops.map(step => step.cost).filter((value): value is number => typeof value === 'number');
  return {
    source,
    destination,
    outcome,
    hops,
    observedHops: hops.filter(step => step.source !== 'estimate').length,
    estimatedHops: hops.filter(step => step.source === 'estimate').length,
    cost: costs.length ? costs.reduce((total, value) => total + value, 0) : null,
    // Only worth saying when the estimate had to carry part of the path: with
    // a complete chain of routing rows, how the route was set up changes
    // nothing about what was read.
    manyToOne: graph.hasManyToOne && destination === graph.coordinator && outcome !== 'tables' && outcome !== 'same'
  };
}

/**
 * Cheapest path over the neighbour graph, ties broken by hop count.
 *
 * The tie-break is not cosmetic: with most links at either cost 1 or the
 * maximum, equal-cost paths are the normal case, and without it the path
 * shown would depend on the order the rows happened to arrive in.
 */
function dijkstra(graph: MeshRouteGraph, source: string, destination: string): MeshHop[] | null {
  if (!graph.adjacency.has(source) || !graph.adjacency.has(destination)) {
    return null;
  }

  const distance = new Map<string, number>([[source, 0]]);
  const depth = new Map<string, number>([[source, 0]]);
  const previous = new Map<string, string>();
  const settled = new Set<string>();

  for (;;) {
    let current: string | undefined;
    let best = Number.POSITIVE_INFINITY;
    let bestDepth = Number.POSITIVE_INFINITY;
    distance.forEach((value, node) => {
      const nodeDepth = depth.get(node) ?? 0;
      if (!settled.has(node) && (value < best || (value === best && nodeDepth < bestDepth))) {
        current = node;
        best = value;
        bestDepth = nodeDepth;
      }
    });
    if (current === undefined) {
      return null;
    }
    if (current === destination) {
      break;
    }
    settled.add(current);

    const from = current;
    graph.adjacency.get(from)?.forEach((edge, neighbour) => {
      if (settled.has(neighbour)) {
        return;
      }
      const candidate = (distance.get(from) ?? 0) + edge.cost;
      const candidateDepth = (depth.get(from) ?? 0) + 1;
      const known = distance.get(neighbour);
      if (
        known === undefined ||
        candidate < known ||
        (candidate === known && candidateDepth < (depth.get(neighbour) ?? 0))
      ) {
        distance.set(neighbour, candidate);
        depth.set(neighbour, candidateDepth);
        previous.set(neighbour, from);
      }
    });
  }

  const path: string[] = [destination];
  while (path[0] !== source) {
    const step = previous.get(path[0]);
    if (step === undefined) {
      return null;
    }
    path.unshift(step);
  }

  const hops: MeshHop[] = [];
  for (let index = 0; index + 1 < path.length; index++) {
    hops.push(hop(graph, path[index], path[index + 1], 'estimate'));
  }
  return hops;
}
