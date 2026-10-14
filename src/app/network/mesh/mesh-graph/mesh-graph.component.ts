import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import {
  TopologyRelationship,
  TopologyScan,
  TopologyScanNeighbour,
  TopologyScanNode,
  TopologyScanRoute
} from '@app/shared/models/topology-scan';
import { TranslateService } from '@ngx-translate/core';
import cytoscape from 'cytoscape';
import {
  familyIcon,
  MeshDeviceFamily,
  MeshDeviceType,
  MESH_COORDINATOR_FAMILY,
  MESH_FAMILY_ICONS
} from '../mesh-device-type';
import { MeshLink, MeshLinkKind, MeshNeighbourRow, MeshNode, MeshRouteHop } from '../mesh-graph.model';
import { iconClass, iconDataUri } from '../mesh-icons';

/** LQI bands, as agreed on issue #167. */
const LQI_POOR_MAX = 100;
const LQI_FAIR_MAX = 174;

/** Bootstrap $red / $blue / $green from src/main.scss, so the graph matches the theme. */
const COLOUR_POOR = '#dc3545';
const COLOUR_FAIR = '#0073dd';
const COLOUR_GOOD = '#28a745';

/** A link neither end measured: not a reading, so not a band either. */
const COLOUR_NO_LQI = '#adb5bd';
/** Routing-table hops, which carry no LQI at all. */
const COLOUR_ROUTE = '#fd7e14';

const COLOUR_COORDINATOR = '#6f42c1';
const COLOUR_ROUTER = COLOUR_FAIR;
const COLOUR_END_DEVICE = '#20c997';
const COLOUR_UNKNOWN = '#868e96';

const COLOUR_STALE = '#ffc107';

/** Health values of `/zdevice-name`, which the scan repeats per node. */
const HEALTH_UNREACHABLE = 'Not Reachable';
const HEALTH_STALE = 'Not seen last 24hours';

/** Which edges to draw. `routes` needs `"routes"` in the scan's `tables`. */
type EdgeMode = 'neighbours' | 'routes' | 'both';

/**
 * How a node is drawn, over and above its type.
 *
 * Health and scan status are two different statements and a node can make both
 * at once, so they are collapsed onto one border channel by severity. The node
 * panel shows each of them as reported, unmerged.
 */
type NodeState = 'unreachable' | 'timeout' | 'not_scanned' | 'stale' | 'ok';

/**
 * The mesh graph: one Cytoscape graph over one `/topology-scan` scan.
 *
 * The payload decides nothing about what gets drawn, on purpose — it reports
 * both directions of every link, keeps `none_of_above` and `previous_child`
 * rows, and lists nodes that have no links at all. The filters here are that
 * choice, made visible rather than made silently.
 */
@Component({
  selector: 'app-mesh-graph',
  templateUrl: './mesh-graph.component.html',
  styleUrls: ['./mesh-graph.component.scss'],
  standalone: false
})
export class MeshGraphComponent extends UnsubscribeOnDestroyAdapter implements OnChanges, AfterViewInit {
  @Input() scan: TopologyScan;
  /**
   * What each node is, by nwkid, joined in from `/zdevice` by the page.
   *
   * Empty is a supported state, and the normal one for the first moments of
   * the page: the scan and the device list are two independent calls, so the
   * graph draws without icons and retints itself when they arrive.
   */
  @Input() deviceTypes = new Map<string, MeshDeviceType>();
  @ViewChild('graph') graphContainer: ElementRef<HTMLDivElement>;

  form: FormGroup;
  layouts = ['cose', 'concentric', 'breadthfirst', 'circle', 'grid'];

  nodes: MeshNode[] = [];
  links: MeshLink[] = [];
  hops: MeshRouteHop[] = [];

  /** True when this scan's backend collects a routing table at all. */
  hasRoutes = false;
  /** True when this scan's backend collects each node's children. */
  hasAssociatedDevices = false;

  /** Rows whose endpoints are not in `nodes`, which the contract says cannot happen. */
  orphanRows = 0;

  visibleNodes = 0;
  visibleLinks = 0;
  visibleHops = 0;

  selectedNode: MeshNode;
  /** The selected node's ZDeviceID, when the device list has one for it. */
  selectedDeviceType: MeshDeviceType;
  selectedNeighbours: MeshNeighbourRow[] = [];
  selectedRoutes: Array<TopologyScanRoute & { roles: string[] }> = [];
  selectedChildren: string[] = [];
  selectedLink: MeshLink;
  selectedHop: MeshRouteHop;

  /** Exposed for the legend. */
  readonly lqiPoorMax = LQI_POOR_MAX;
  readonly lqiFairMax = LQI_FAIR_MAX;

  /**
   * The icon families this scan actually contains.
   *
   * Only the glyphs on screen are listed. A legend of nineteen device families
   * on a mesh of lights and plugs is a wall of text that says nothing about
   * this network.
   */
  iconLegend: Array<{ family: MeshDeviceFamily; icon: string }> = [];

  private cy: cytoscape.Core;
  private viewReady = false;
  private nodesById = new Map<string, MeshNode>();

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.scan) {
      return;
    }
    if (changes.scan) {
      this.buildForm();
      this.build(this.scan);
      this.clearSelection();
      this.render();
      return;
    }
    if (changes.deviceTypes) {
      // The ZDeviceIDs usually land after the graph is already drawn. The
      // nodes are retinted in place rather than re-rendered, so neither the
      // layout nor the filters the user has set are thrown away.
      this.buildIconLegend();
      this.applyIcons();
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroyGraph();
  }

  zoomIn(): void {
    this.zoomBy(1.3);
  }

  zoomOut(): void {
    this.zoomBy(1 / 1.3);
  }

  fit(): void {
    this.cy?.animate({ fit: { eles: this.cy.elements(':visible'), padding: 30 }, duration: 200 });
  }

  runLayout(): void {
    if (this.cy) {
      this.zone.runOutsideAngular(() => this.applyLayout());
    }
  }

  clearSelection(): void {
    this.selectedNode = undefined;
    this.selectedDeviceType = undefined;
    this.selectedLink = undefined;
    this.selectedHop = undefined;
    this.selectedNeighbours = [];
    this.selectedRoutes = [];
    this.selectedChildren = [];
    this.cy?.elements().removeClass('faded highlighted');
  }

  /** Colour of an LQI reading. `null` is not a reading and gets its own colour. */
  lqiColour(lqi: number | null): string {
    if (lqi === null || lqi === undefined) {
      return COLOUR_NO_LQI;
    }
    if (lqi <= LQI_POOR_MAX) {
      return COLOUR_POOR;
    }
    return lqi <= LQI_FAIR_MAX ? COLOUR_FAIR : COLOUR_GOOD;
  }

  /** True when the current mode draws neighbour links. */
  get drawsLinks(): boolean {
    return this.form?.get('edges').value !== 'routes';
  }

  /** True when the current mode draws routing hops. */
  get drawsHops(): boolean {
    return this.hasRoutes && this.form?.get('edges').value !== 'neighbours';
  }

  label(nwkid: string): string {
    return this.nodesById.get(nwkid)?.label ?? nwkid;
  }

  /** True when the graph is drawing device icons rather than plain shapes. */
  get showsIcons(): boolean {
    return !!this.form?.get('showIcons').value;
  }

  /** The Font Awesome class of a family's glyph, for the legend and the panel. */
  familyIconClass(family: MeshDeviceFamily): string {
    return iconClass(familyIcon(family));
  }

  /**
   * The icon family of a node, or `undefined` when there is nothing to say.
   *
   * An unresolved ZDeviceID deliberately draws no icon: the node keeps the
   * shape it has always had, which reads as "the mesh knows where this is,
   * the plugin does not know what it is". The coordinator is the one
   * exception — see `MESH_COORDINATOR_FAMILY`.
   */
  familyOf(node: TopologyScanNode): MeshDeviceFamily | undefined {
    const family = this.deviceTypes?.get(node.nwkid)?.family;
    if (family) {
      return family;
    }
    return node.logical_type === 'coordinator' ? MESH_COORDINATOR_FAMILY : undefined;
  }

  /**
   * The translation of one of the payload's closed-set values.
   *
   * The sets are closed in practice but must be treated as open: an
   * unrecognised value is shown as it arrived rather than as a missing
   * translation key, which is what ngx-translate would otherwise print.
   */
  valueLabel(group: string, value: string | null): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const key = `network.mesh.value.${group}.${value}`;
    const translated = this.translate.instant(key);
    return translated === key ? value : translated;
  }

  /** The one-line explanation of a value, or `''` when there is none to show. */
  valueHelp(group: string, value: string | null): string {
    if (!value) {
      return '';
    }
    const key = `network.mesh.value.${group}.${value}.help`;
    const translated = this.translate.instant(key);
    return translated === key ? '' : translated;
  }

  /** A measurement, or a dash — never a `null` rendered as if it were a reading. */
  reading(value: number | string | null): string {
    return value === null || value === undefined || value === '' ? '-' : String(value);
  }

  private buildForm(): void {
    this.hasRoutes = !!this.scan.tables?.includes('routes');
    this.hasAssociatedDevices = !!this.scan.tables?.includes('associated_devices');

    if (this.form) {
      // A backend that cannot answer routes must not be left showing a routes
      // overlay selected against a previous scan from one that could.
      if (!this.hasRoutes && this.form.get('edges').value !== 'neighbours') {
        this.form.get('edges').setValue('neighbours', { emitEvent: false });
      }
      this.syncControlAvailability();
      return;
    }

    this.form = this.formBuilder.group({
      focusedNode: [null],
      layout: ['cose'],
      edges: ['neighbours'],
      showTree: [true],
      showSibling: [true],
      // none_of_above and previous_child: present in the payload, off by
      // default, as the API document suggests.
      showOther: [false],
      showUnknown: [true],
      lqiThreshold: [0],
      hideEndDevices: [false],
      hideIsolated: [false],
      showIcons: [true]
    });

    this.subs.sink = this.form.get('focusedNode').valueChanges.subscribe((nwkid: string) => this.focusNode(nwkid));
    this.subs.sink = this.form.get('layout').valueChanges.subscribe(() => this.runLayout());
    this.subs.sink = this.form.get('edges').valueChanges.subscribe(() => {
      this.syncControlAvailability();
      this.applyFilters();
    });
    ['showTree', 'showSibling', 'showOther', 'showUnknown', 'lqiThreshold', 'hideEndDevices', 'hideIsolated'].forEach(
      name => {
        this.subs.sink = this.form.get(name).valueChanges.subscribe(() => this.applyFilters());
      }
    );
    // Icons are a drawing choice, not a filter: nothing is added to or taken
    // off the graph, so applyFilters() has no part in it.
    this.subs.sink = this.form.get('showIcons').valueChanges.subscribe(() => this.applyIcons());
    this.syncControlAvailability();
  }

  /**
   * Grey out the controls the current mode cannot act on.
   *
   * A routing-table row carries neither an LQI nor a relationship, so in
   * routes-only mode the threshold and the four relationship filters do
   * nothing at all. Leaving them live is what made a screen of orange routing
   * hops read as a mesh with no link above LQI 100: the legend was still
   * advertising the LQI bands, and the threshold still showed a number.
   */
  private syncControlAvailability(): void {
    const drawsLinks = this.drawsLinks;
    ['lqiThreshold', 'showTree', 'showSibling', 'showOther', 'showUnknown'].forEach(name => {
      const control = this.form.get(name);
      // emitEvent: false, because enabling or disabling a control fires
      // valueChanges, and every one of these re-enters applyFilters().
      if (drawsLinks) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
    });
  }

  /**
   * Turn one scan into nodes, links and route hops.
   *
   * Nothing is joined against `/zdevice-name`: the scan's `nodes` already
   * carry ieee, model, health, lqi, rssi and battery, and it lists every node
   * the scan mentioned, so an edge endpoint is always present.
   */
  private build(scan: TopologyScan): void {
    this.orphanRows = 0;

    this.nodes = (scan.nodes ?? []).map(node => ({
      ...node,
      label: node.name || node.nwkid,
      links: 0
    }));
    this.nodesById = new Map(this.nodes.map(node => [node.nwkid, node]));

    this.links = this.buildLinks(scan.neighbours ?? []);
    this.hops = this.buildHops(scan.routes ?? []);

    this.buildIconLegend();

    this.links.forEach(link => {
      const a = this.nodesById.get(link.a);
      const b = this.nodesById.get(link.b);
      if (a) {
        a.links += 1;
      }
      if (b) {
        b.links += 1;
      }
    });
  }

  /**
   * Collapse the neighbour rows onto one link per pair of nodes.
   *
   * `(A,B)` and `(B,A)` are two rows with two LQIs because A and B measured
   * the same radio link separately. Both are kept on the link; the panel shows
   * them side by side, which is how a node that hears well but is not heard
   * gets spotted.
   */
  private buildLinks(neighbours: TopologyScanNeighbour[]): MeshLink[] {
    const byPair = new Map<string, MeshLink>();

    neighbours.forEach(row => {
      if (!this.nodesById.has(row.reporter) || !this.nodesById.has(row.neighbor)) {
        this.orphanRows += 1;
        return;
      }
      if (row.reporter === row.neighbor) {
        return;
      }

      const [a, b] = [row.reporter, row.neighbor].sort();
      const key = `${a}\u0000${b}`;
      let link = byPair.get(key);
      if (!link) {
        link = {
          id: `link-${byPair.size}`,
          a,
          b,
          lqi: null,
          kind: 'unknown',
          relationships: [],
          oneSided: true
        };
        byPair.set(key, link);
      }

      if (row.reporter === a) {
        link.aReported = row;
      } else {
        link.bReported = row;
      }
    });

    return Array.from(byPair.values()).map(link => {
      const rows = [link.aReported, link.bReported].filter(Boolean);
      const readings = rows.map(row => row.lqi).filter((lqi): lqi is number => typeof lqi === 'number');

      link.lqi = readings.length ? Math.max(...readings) : null;
      link.relationships = rows.map(row => row.relationship);
      link.kind = this.kindOf(link.relationships);
      link.oneSided = rows.length === 1;
      return link;
    });
  }

  /**
   * `parent` and `child` are one relationship seen from its two ends, so they
   * are one group. An unrecognised value lands in `unknown` rather than being
   * dropped.
   */
  private kindOf(relationships: TopologyRelationship[]): MeshLinkKind {
    if (relationships.some(value => value === 'parent' || value === 'child')) {
      return 'tree';
    }
    if (relationships.some(value => value === 'sibling')) {
      return 'sibling';
    }
    if (relationships.some(value => value === 'none_of_above' || value === 'previous_child')) {
      return 'other';
    }
    return 'unknown';
  }

  /**
   * Collapse the routing rows onto one hop per `(reporter, next_hop)`.
   *
   * A router usually reaches a dozen destinations through the same neighbour,
   * and a dozen parallel arrows between the same two nodes say nothing one
   * arrow does not. The rows are kept so the panel can list where each leads.
   */
  private buildHops(routes: TopologyScanRoute[]): MeshRouteHop[] {
    const byHop = new Map<string, MeshRouteHop>();

    routes.forEach(row => {
      if (!this.nodesById.has(row.reporter) || !this.nodesById.has(row.next_hop)) {
        this.orphanRows += 1;
        return;
      }
      if (row.reporter === row.next_hop) {
        return;
      }

      const key = `${row.reporter}\u0000${row.next_hop}`;
      let hop = byHop.get(key);
      if (!hop) {
        hop = {
          id: `hop-${byHop.size}`,
          reporter: row.reporter,
          nextHop: row.next_hop,
          rows: [],
          inactive: false
        };
        byHop.set(key, hop);
      }
      hop.rows.push(row);
    });

    return Array.from(byHop.values()).map(hop => {
      hop.inactive = !hop.rows.some(row => row.status === 'active' || row.status === 'validation_underway');
      return hop;
    });
  }

  private render(): void {
    if (!this.viewReady || !this.graphContainer || !this.nodes.length) {
      return;
    }
    this.destroyGraph();

    // Cytoscape drives its own render loop and fires events on every mouse
    // move; keeping it out of the Angular zone avoids a change-detection pass
    // per frame. Handlers that touch component state re-enter with zone.run().
    this.zone.runOutsideAngular(() => {
      this.cy = cytoscape({
        container: this.graphContainer.nativeElement,
        elements: this.elements(),
        style: this.stylesheet(),
        minZoom: 0.1,
        maxZoom: 4,
        wheelSensitivity: 0.2
      });

      this.cy.on('tap', 'node', event => {
        const id = event.target.id();
        this.zone.run(() => this.selectNode(id));
      });
      this.cy.on('tap', 'edge', event => {
        const id = event.target.id();
        this.zone.run(() => this.selectEdge(id));
      });
      this.cy.on('tap', event => {
        if (event.target === this.cy) {
          this.zone.run(() => this.clearSelection());
        }
      });

      this.applyFilters();
      this.applyLayout();
    });

    this.cdr.detectChanges();
  }

  private elements(): cytoscape.ElementDefinition[] {
    const nodes: cytoscape.ElementDefinition[] = this.nodes.map(node => ({
      group: 'nodes',
      data: {
        id: node.nwkid,
        // The network id is on the node itself rather than only in the panel:
        // the issue asks for it to be visible per node, and a name alone does
        // not identify a device.
        label: node.name ? `${node.name}\n${node.nwkid}` : node.nwkid,
        type: node.logical_type,
        state: this.stateOf(node),
        isolated: node.links === 0,
        // `''` when there is no glyph to draw. The stylesheet selects on
        // `[?icon]`, the truthy form: `[icon]` matches a field that is merely
        // defined, which would catch every node and leave the empty ones
        // invisible.
        icon: this.iconOf(node)
      }
    }));

    const links: cytoscape.ElementDefinition[] = this.links.map(link => ({
      group: 'edges',
      data: {
        id: link.id,
        source: link.a,
        target: link.b,
        kind: link.kind,
        lqi: link.lqi,
        hasLqi: link.lqi !== null,
        colour: this.lqiColour(link.lqi),
        width: this.linkWidth(link.lqi)
      }
    }));

    const hops: cytoscape.ElementDefinition[] = this.hops.map(hop => ({
      group: 'edges',
      data: {
        id: hop.id,
        source: hop.reporter,
        target: hop.nextHop,
        kind: 'route',
        inactive: hop.inactive
      }
    }));

    return [...nodes, ...links, ...hops];
  }

  /** Severity order: health first, then how the scan went, then nothing to say. */
  private stateOf(node: TopologyScanNode): NodeState {
    if (node.health === HEALTH_UNREACHABLE) {
      return 'unreachable';
    }
    if (node.scan_status === 'timeout') {
      return 'timeout';
    }
    if (node.scan_status === 'not_scanned') {
      return 'not_scanned';
    }
    return node.health === HEALTH_STALE ? 'stale' : 'ok';
  }

  /**
   * The `icon` field of a node, or nothing at all.
   *
   * Cytoscape draws on a canvas, so the glyph is an SVG data URI rather than
   * a font element, and it is tinted here: with the box gone, the colour of
   * the glyph is what carries the coordinator/router/end-device channel.
   */
  private iconOf(node: TopologyScanNode): string {
    if (!this.showsIcons) {
      return '';
    }
    const family = this.familyOf(node);
    const icon = family ? familyIcon(family) : '';
    return icon ? iconDataUri(icon, this.typeColour(node.logical_type)) : '';
  }

  /** The colour of a logical type, shared by the node fill and its glyph. */
  private typeColour(type: string): string {
    switch (type) {
      case 'coordinator':
        return COLOUR_COORDINATOR;
      case 'router':
        return COLOUR_ROUTER;
      case 'end_device':
        return COLOUR_END_DEVICE;
      default:
        return COLOUR_UNKNOWN;
    }
  }

  /**
   * Retint the nodes of the graph that is already on screen.
   *
   * Called when the ZDeviceIDs arrive after the scan, and when the icon
   * checkbox is toggled. Setting the one data field is enough — Cytoscape
   * re-evaluates the stylesheet on a data change — and it leaves the layout,
   * the selection and the filters alone.
   */
  private applyIcons(): void {
    if (!this.cy) {
      return;
    }
    this.cy.batch(() => {
      this.cy.nodes().forEach(element => {
        const node = this.nodesById.get(element.id());
        element.data('icon', node ? this.iconOf(node) : '');
      });
    });
  }

  /** The families present in this scan, in the order the icon table lists them. */
  private buildIconLegend(): void {
    const present = new Set<MeshDeviceFamily>();
    this.nodes.forEach(node => {
      const family = this.familyOf(node);
      if (family) {
        present.add(family);
      }
    });
    this.iconLegend = (Object.keys(MESH_FAMILY_ICONS) as MeshDeviceFamily[])
      .filter(family => present.has(family))
      .map(family => ({ family, icon: familyIcon(family) }));
  }

  private linkWidth(lqi: number | null): number {
    if (lqi === null) {
      return 1;
    }
    return lqi <= LQI_POOR_MAX ? 1 : lqi <= LQI_FAIR_MAX ? 2 : 3;
  }

  private stylesheet(): cytoscape.StylesheetJson {
    return [
      {
        selector: 'node',
        style: {
          shape: 'ellipse',
          'background-color': COLOUR_UNKNOWN,
          'border-width': 2,
          'border-color': '#495057',
          width: 22,
          height: 22,
          label: 'data(label)',
          'text-wrap': 'wrap',
          'font-size': 9,
          'text-valign': 'bottom',
          'text-margin-y': 3,
          'text-background-color': '#fff',
          'text-background-opacity': 0.75,
          'text-background-padding': '1px',
          color: '#212529'
        }
      },
      // Shape and fill say what a node is; the border says how it is doing.
      {
        selector: 'node[type = "router"]',
        style: { shape: 'round-rectangle', 'background-color': COLOUR_ROUTER, width: 40, height: 24 }
      },
      {
        selector: 'node[type = "coordinator"]',
        style: {
          shape: 'round-rectangle',
          'background-color': COLOUR_COORDINATOR,
          width: 56,
          height: 32,
          'font-size': 11,
          'font-weight': 'bold'
        }
      },
      { selector: 'node[type = "end_device"]', style: { 'background-color': COLOUR_END_DEVICE } },
      { selector: 'node[type = "unknown"]', style: { shape: 'diamond', width: 26, height: 26 } },

      // A node whose ZDeviceID is known is drawn as its glyph instead of as a
      // box: the fill is made transparent (`background-opacity` applies to
      // the colour, not to the image) and the border is dropped, so the only
      // thing left is the glyph, tinted to the logical type's colour. The
      // state rules below then put the border back on the nodes that have
      // something to report, which is why they come after this one.
      {
        selector: 'node[?icon]',
        style: {
          shape: 'round-rectangle',
          'background-image': 'data(icon)',
          'background-fit': 'contain',
          'background-opacity': 0,
          'border-width': 0,
          width: 36,
          height: 36
        }
      },
      { selector: 'node[?icon][type = "coordinator"]', style: { width: 48, height: 48 } },

      { selector: 'node[state = "unreachable"]', style: { 'border-color': COLOUR_POOR, 'border-width': 4 } },
      {
        selector: 'node[state = "timeout"]',
        style: { 'border-color': COLOUR_ROUTE, 'border-width': 4, 'border-style': 'dashed' }
      },
      {
        selector: 'node[state = "not_scanned"]',
        style: { 'border-color': COLOUR_UNKNOWN, 'border-width': 3, 'border-style': 'dashed' }
      },
      { selector: 'node[state = "stale"]', style: { 'border-color': COLOUR_STALE, 'border-width': 3 } },

      {
        selector: 'edge',
        style: {
          // Bezier rather than straight so a neighbour link and a routing hop
          // between the same two nodes do not draw on top of each other.
          'curve-style': 'bezier',
          'control-point-step-size': 18,
          'line-color': 'data(colour)',
          width: 'data(width)',
          opacity: 0.65
        }
      },
      { selector: 'edge[kind = "sibling"]', style: { 'line-style': 'dashed' } },
      { selector: 'edge[kind = "other"]', style: { 'line-style': 'dotted' } },
      {
        // Routing hops are directed and carry no LQI, so they are told apart
        // by an arrow and their own colour rather than by line style.
        selector: 'edge[kind = "route"]',
        style: {
          'line-color': COLOUR_ROUTE,
          'line-style': 'solid',
          width: 2,
          'target-arrow-shape': 'triangle',
          'target-arrow-color': COLOUR_ROUTE,
          'arrow-scale': 0.9
        }
      },
      { selector: 'edge[kind = "route"][?inactive]', style: { 'line-style': 'dashed', opacity: 0.4 } },

      { selector: 'node:selected', style: { 'border-color': '#212529', 'border-width': 4 } },
      { selector: 'edge:selected', style: { opacity: 1, width: 5 } },
      { selector: '.highlighted', style: { opacity: 1, 'font-weight': 'bold' } },
      { selector: '.faded', style: { opacity: 0.12, 'text-opacity': 0 } },
      { selector: '.hidden', style: { display: 'none' } }
    ];
  }

  private applyLayout(): void {
    if (!this.cy) {
      return;
    }
    const name = this.form.get('layout').value as string;
    const options: any = { name, animate: false, fit: true, padding: 30 };

    if (name === 'cose') {
      options.nodeRepulsion = 12000;
      options.idealEdgeLength = 90;
      options.nodeOverlap = 16;
      options.componentSpacing = 120;
    }
    if (name === 'breadthfirst' || name === 'concentric') {
      // `coordinator` is in the payload so the graph has a root without
      // hardcoding one.
      const root = this.cy.getElementById(this.scan.coordinator);
      if (root.nonempty()) {
        if (name === 'breadthfirst') {
          options.roots = root;
        } else {
          options.concentric = (node: cytoscape.NodeSingular) =>
            node.id() === this.scan.coordinator ? 1000 : node.degree(false);
          options.levelWidth = () => 2;
        }
      }
    }

    this.cy.layout(options).run();
  }

  private applyFilters(): void {
    if (!this.cy) {
      return;
    }
    const edges = this.form.get('edges').value as EdgeMode;
    const kinds: Record<MeshLinkKind, boolean> = {
      tree: !!this.form.get('showTree').value,
      sibling: !!this.form.get('showSibling').value,
      other: !!this.form.get('showOther').value,
      unknown: !!this.form.get('showUnknown').value
    };
    const threshold = Number(this.form.get('lqiThreshold').value) || 0;
    const hideEndDevices = !!this.form.get('hideEndDevices').value;
    const hideIsolated = !!this.form.get('hideIsolated').value;

    this.cy.batch(() => {
      this.cy.nodes().forEach(node => {
        node.toggleClass('hidden', hideEndDevices && node.data('type') === 'end_device');
      });

      this.cy.edges().forEach(edge => {
        const kind = edge.data('kind') as MeshLinkKind | 'route';
        let hidden: boolean;

        if (kind === 'route') {
          hidden = edges === 'neighbours';
        } else {
          // A link neither end measured has no reading to compare with the
          // threshold, so the threshold does not apply to it.
          const belowThreshold = !!edge.data('hasLqi') && Number(edge.data('lqi')) < threshold;
          hidden = edges === 'routes' || !kinds[kind] || belowThreshold;
        }

        edge.toggleClass('hidden', hidden || edge.source().hasClass('hidden') || edge.target().hasClass('hidden'));
      });

      if (hideIsolated) {
        // Cytoscape's selector grammar has no `:not()`, and an unparsable
        // selector matches everything rather than failing, so the class is
        // subtracted with `not()` instead.
        this.cy
          .nodes()
          .not('.hidden')
          .forEach(node => {
            node.toggleClass('hidden', node.connectedEdges().not('.hidden').empty());
          });
      }
    });

    this.visibleNodes = this.cy.nodes().not('.hidden').length;
    this.visibleLinks = this.cy.edges('[kind != "route"]').not('.hidden').length;
    this.visibleHops = this.cy.edges('[kind = "route"]').not('.hidden').length;
  }

  private selectEdge(id: string): void {
    const link = this.links.find(candidate => candidate.id === id);
    if (link) {
      this.selectLink(link);
      return;
    }
    const hop = this.hops.find(candidate => candidate.id === id);
    if (hop) {
      this.selectHop(hop);
    }
  }

  private selectNode(nwkid: string): void {
    const node = this.nodesById.get(nwkid);
    if (!node) {
      return;
    }
    this.selectedLink = undefined;
    this.selectedHop = undefined;
    this.selectedNode = node;
    this.selectedDeviceType = this.deviceTypes?.get(nwkid);
    this.selectedNeighbours = this.neighbourRows(nwkid);
    this.selectedRoutes = this.routeRows(nwkid);
    this.selectedChildren = node.associated_devices ?? [];

    const element = this.cy.getElementById(nwkid);
    this.cy.batch(() => {
      this.cy.elements().addClass('faded').removeClass('highlighted');
      element.closedNeighborhood().removeClass('faded').addClass('highlighted');
    });
  }

  private selectLink(link: MeshLink): void {
    this.selectedNode = undefined;
    this.selectedDeviceType = undefined;
    this.selectedHop = undefined;
    this.selectedNeighbours = [];
    this.selectedRoutes = [];
    this.selectedChildren = [];
    this.selectedLink = link;
    this.highlightEdge(link.id);
  }

  private selectHop(hop: MeshRouteHop): void {
    this.selectedNode = undefined;
    this.selectedDeviceType = undefined;
    this.selectedLink = undefined;
    this.selectedNeighbours = [];
    this.selectedRoutes = [];
    this.selectedChildren = [];
    this.selectedHop = hop;
    this.highlightEdge(hop.id);
  }

  private highlightEdge(id: string): void {
    const edge = this.cy.getElementById(id);
    this.cy.batch(() => {
      this.cy.elements().addClass('faded').removeClass('highlighted');
      edge.removeClass('faded').addClass('highlighted');
      edge.connectedNodes().removeClass('faded').addClass('highlighted');
    });
  }

  /**
   * Every neighbour row this node appears in, from its own point of view.
   *
   * `reported` is a row out of this node's own neighbour table, `heard` a row
   * another node reported about it. The LQI belongs to whichever node reported
   * it, which is why the two are not merged into one number.
   */
  private neighbourRows(nwkid: string): MeshNeighbourRow[] {
    const rows: MeshNeighbourRow[] = [];

    this.links
      .filter(link => link.a === nwkid || link.b === nwkid)
      .forEach(link => {
        [link.aReported, link.bReported].filter(Boolean).forEach(row => {
          const reported = row.reporter === nwkid;
          const peer = reported ? row.neighbor : row.reporter;
          rows.push({
            peer,
            peerLabel: this.label(peer),
            direction: reported ? 'reported' : 'heard',
            relationship: row.relationship,
            device_type: row.device_type,
            lqi: row.lqi,
            depth: row.depth,
            rx_on_when_idle: row.rx_on_when_idle,
            permit_joining: row.permit_joining
          });
        });
      });

    return rows.sort((a, b) => (b.lqi ?? -1) - (a.lqi ?? -1));
  }

  /**
   * Every routing row this node takes part in, and in which roles.
   *
   * Roles are a list rather than one value because they are not exclusive: on
   * a one-hop route, `next_hop == destination`, so the node is both.
   */
  private routeRows(nwkid: string): Array<TopologyScanRoute & { roles: string[] }> {
    const rows: Array<TopologyScanRoute & { roles: string[] }> = [];

    (this.scan.routes ?? []).forEach(row => {
      const roles: string[] = [];
      if (row.reporter === nwkid) {
        roles.push('reporter');
      }
      if (row.next_hop === nwkid) {
        roles.push('next_hop');
      }
      if (row.destination === nwkid) {
        roles.push('destination');
      }
      if (roles.length) {
        rows.push({ ...row, roles });
      }
    });

    return rows;
  }

  private focusNode(nwkid: string): void {
    if (!nwkid || !this.cy) {
      return;
    }
    const node = this.cy.getElementById(nwkid);
    if (node.empty()) {
      return;
    }
    this.cy.animate({ center: { eles: node }, zoom: 1.2, duration: 250 });
    this.selectNode(nwkid);
  }

  private zoomBy(factor: number): void {
    if (!this.cy) {
      return;
    }
    this.cy.zoom({
      level: this.cy.zoom() * factor,
      renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
    });
  }

  private destroyGraph(): void {
    this.cy?.destroy();
    this.cy = undefined;
  }
}
