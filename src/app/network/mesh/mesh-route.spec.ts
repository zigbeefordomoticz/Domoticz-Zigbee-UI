import { describe, expect, it } from 'vitest';
import {
  TopologyRouteStatus,
  TopologyScan,
  TopologyScanNeighbour,
  TopologyScanRoute
} from '@app/shared/models/topology-scan';
import { buildRouteGraph, computePath, computePathsFrom, linkCost, MAX_LINK_COST } from './mesh-route';

const link = (reporter: string, neighbor: string, lqi: number | null) =>
  ({ reporter, neighbor, lqi }) as TopologyScanNeighbour;
const route = (
  reporter: string,
  destination: string,
  next_hop: string,
  status: TopologyRouteStatus = 'active',
  many_to_one = false
) => ({ reporter, destination, next_hop, status, many_to_one }) as TopologyScanRoute;

/**
 * 0000 (coordinator) - aaaa - bbbb - cccc - dddd, all at LQI 255 (cost 1), plus a weak 0000 - cccc
 * link (LQI 100, cost 7). eeee is a sleepy child of cccc that no neighbour table lists. zzzz is alone.
 */
const scan = (routes: TopologyScanRoute[] = []): TopologyScan =>
  ({
    coordinator: '0000',
    nodes: [
      { nwkid: '0000', associated_devices: [] },
      { nwkid: 'cccc', associated_devices: ['eeee', 'cccc'] },
      { nwkid: 'zzzz' }
    ],
    neighbours: [
      link('0000', 'aaaa', 255),
      link('aaaa', 'bbbb', 255),
      link('bbbb', 'cccc', 255),
      link('cccc', 'dddd', 255),
      link('0000', 'cccc', 100)
    ],
    routes
  }) as unknown as TopologyScan;

const hops = (path: { hops: { from: string; to: string; source: string }[] }) =>
  path.hops.map(step => `${step.from}>${step.to}:${step.source}`);

describe('linkCost', () => {
  it.each([
    [255, 1],
    [240, 1],
    [230, 2],
    [200, 3],
    [128, MAX_LINK_COST],
    [0, MAX_LINK_COST],
    [null, MAX_LINK_COST]
  ])('LQI %j costs %i', (lqi, cost) => {
    expect(linkCost(lqi)).toBe(cost);
  });
});

describe('buildRouteGraph', () => {
  it('keeps the worse cost of the two directions and the better LQI', () => {
    const graph = buildRouteGraph({
      coordinator: '0000',
      neighbours: [link('aaaa', 'bbbb', 255), link('bbbb', 'aaaa', 128)],
      routes: [],
      nodes: []
    } as unknown as TopologyScan);
    expect(graph.adjacency.get('aaaa')!.get('bbbb')).toEqual({ cost: MAX_LINK_COST, lqi: 255 });
    expect(graph.adjacency.get('bbbb')!.get('aaaa')).toEqual({ cost: MAX_LINK_COST, lqi: 255 });
  });

  it('ignores a node listing itself', () => {
    const graph = buildRouteGraph(scan());
    expect(graph.parents.get('eeee')).toBe('cccc');
    expect(graph.parents.has('cccc')).toBe(false);
  });

  it('prefers an active routing row, whatever the order', () => {
    const graph = buildRouteGraph(scan([route('aaaa', 'dddd', 'bbbb'), route('aaaa', 'dddd', '0000', 'inactive')]));
    expect(graph.routes.get('aaaa')!.get('dddd')!.next_hop).toBe('bbbb');
    const reversed = buildRouteGraph(scan([route('aaaa', 'dddd', '0000', 'inactive'), route('aaaa', 'dddd', 'bbbb')]));
    expect(reversed.routes.get('aaaa')!.get('dddd')!.next_hop).toBe('bbbb');
  });

  it('copes with a scan missing its tables', () => {
    const graph = buildRouteGraph({ coordinator: '0000' } as TopologyScan);
    expect(graph.adjacency.size).toBe(0);
    expect(graph.hasManyToOne).toBe(false);
  });
});

describe('computePath', () => {
  it('is same / unreachable for degenerate requests', () => {
    const graph = buildRouteGraph(scan());
    expect(computePath(graph, 'aaaa', 'aaaa').outcome).toBe('same');
    expect(computePath(graph, '', 'aaaa').outcome).toBe('unreachable');
    expect(computePath(graph, 'aaaa', 'zzzz').outcome).toBe('unreachable');
  });

  it('delivers to a neighbour directly, even over a weak link', () => {
    const path = computePath(buildRouteGraph(scan()), '0000', 'cccc');
    expect(path.outcome).toBe('tables');
    expect(hops(path)).toEqual(['0000>cccc:direct']);
    expect(path.cost).toBe(MAX_LINK_COST);
  });

  it('estimates the cheapest path when no routing row exists', () => {
    const path = computePath(buildRouteGraph(scan()), 'aaaa', 'dddd');
    expect(path.outcome).toBe('estimate');
    // aaaa > bbbb > cccc > dddd costs 3; through 0000 it would cost 1 + 7 + 1
    expect(hops(path)).toEqual(['aaaa>bbbb:estimate', 'bbbb>cccc:estimate', 'cccc>dddd:estimate']);
    expect([path.observedHops, path.estimatedHops, path.cost]).toEqual([0, 3, 3]);
  });

  it('follows active routing rows', () => {
    const path = computePath(
      buildRouteGraph(scan([route('aaaa', 'dddd', 'bbbb'), route('bbbb', 'dddd', 'cccc')])),
      'aaaa',
      'dddd'
    );
    expect(path.outcome).toBe('tables');
    expect(hops(path)).toEqual(['aaaa>bbbb:table', 'bbbb>cccc:table', 'cccc>dddd:direct']);
    expect(path.hops[0].status).toBe('active');
  });

  it('estimates the whole rest once the rows run out', () => {
    const path = computePath(buildRouteGraph(scan([route('0000', 'dddd', 'aaaa')])), '0000', 'dddd');
    expect(path.outcome).toBe('hybrid');
    expect(hops(path)).toEqual(['0000>aaaa:table', 'aaaa>bbbb:estimate', 'bbbb>cccc:estimate', 'cccc>dddd:estimate']);
    expect([path.observedHops, path.estimatedHops]).toEqual([1, 3]);
  });

  it('does not follow a row that is not active', () => {
    const path = computePath(
      buildRouteGraph(scan([route('aaaa', 'dddd', '0000', 'discovery_underway')])),
      'aaaa',
      'dddd'
    );
    expect(path.outcome).toBe('estimate');
    expect(path.hops[0].to).toBe('bbbb');
  });

  it('reaches a sleepy child through its parent', () => {
    const graph = buildRouteGraph(scan());
    expect(hops(computePath(graph, 'cccc', 'eeee'))).toEqual(['cccc>eeee:parent']);
    const path = computePath(graph, '0000', 'eeee');
    expect(hops(path)).toEqual(['0000>aaaa:estimate', 'aaaa>bbbb:estimate', 'bbbb>cccc:estimate', 'cccc>eeee:parent']);
    expect(path.outcome).toBe('hybrid');
  });

  it('detects routing rows pointing in a circle', () => {
    const graph = buildRouteGraph(scan([route('aaaa', 'zzzz', 'bbbb'), route('bbbb', 'zzzz', 'aaaa')]));
    expect(computePath(graph, 'aaaa', 'zzzz').outcome).toBe('loop');
  });

  it('breaks a cost tie on hop count', () => {
    // s > a > m > d costs 1 + 1 + 2 and reaches d first; s > n > d costs 3 + 1: same cost, one hop less
    const graph = buildRouteGraph({
      coordinator: 's',
      nodes: [],
      routes: [],
      neighbours: [
        link('s', 'a', 255),
        link('a', 'm', 255),
        link('m', 'd', 230),
        link('s', 'n', 200),
        link('n', 'd', 255)
      ]
    } as unknown as TopologyScan);
    const path = computePath(graph, 's', 'd');
    expect(hops(path)).toEqual(['s>n:estimate', 'n>d:estimate']);
    expect(path.cost).toBe(4);
  });

  it('says many-to-one only for an estimated path to the coordinator', () => {
    const m2o = route('bbbb', '0000', 'aaaa', 'inactive', true);
    const graph = buildRouteGraph(scan([m2o]));
    expect(graph.hasManyToOne).toBe(true);
    expect(computePath(graph, 'dddd', '0000').manyToOne).toBe(true);
    expect(computePath(graph, 'aaaa', '0000').manyToOne).toBe(false);
    expect(computePath(graph, 'aaaa', 'dddd').manyToOne).toBe(false);
  });
});

describe('computePathsFrom', () => {
  it('leaves out the source and the nodes nothing connects', () => {
    const paths = computePathsFrom(buildRouteGraph(scan()), '0000', ['0000', 'aaaa', 'eeee', 'zzzz']);
    expect(paths.map(path => path.destination)).toEqual(['aaaa', 'eeee']);
  });
});
