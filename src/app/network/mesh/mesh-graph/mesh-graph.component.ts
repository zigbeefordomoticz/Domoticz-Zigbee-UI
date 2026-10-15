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
import { MeshChildLink, MeshLink, MeshLinkKind, MeshNeighbourRow, MeshNode, MeshRouteHop } from '../mesh-graph.model';
import { iconClass, iconDataUri } from '../mesh-icons';
import { buildRouteGraph, computePath, computePathsFrom, MeshPath, MeshRouteGraph } from '../mesh-route';

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
/** Parent -> child edges of the Associated Devices table, which carry no LQI either. */
const COLOUR_CHILD = '#d63384';
/** The computed path, which is an answer about the mesh rather than a part of it. */
const COLOUR_PATH = '#6610f2';

const COLOUR_COORDINATOR = '#6f42c1';
const COLOUR_ROUTER = COLOUR_FAIR;
const COLOUR_END_DEVICE = '#20c997';
const COLOUR_UNKNOWN = '#868e96';

const COLOUR_STALE = '#ffc107';

/** Health values of `/zdevice-name`, which the scan repeats per node. */
const HEALTH_UNREACHABLE = 'Not Reachable';
const HEALTH_STALE = 'Not seen last 24hours';

/**
 * Which edges to draw, and every mode needs its table in the scan's `tables`.
 *
 * The modes are exclusive rather than a set of overlays, because the three
 * tables answer three different questions about the same mesh and a node pair
 * can appear in all of them at once. `children` is the one view that answers
 * "what is this device attached to" — see `MeshChildLink`.
 */
type EdgeMode = 'neighbours' | 'routes' | 'both' | 'children';

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
  /** The element that goes fullscreen: the graph and the controls it carries. */
  @ViewChild('graphShell') graphShell: ElementRef<HTMLDivElement>;

  form: FormGroup;
  layouts = ['cose', 'concentric', 'breadthfirst', 'circle', 'grid'];

  nodes: MeshNode[] = [];
  links: MeshLink[] = [];
  hops: MeshRouteHop[] = [];
  childLinks: MeshChildLink[] = [];

  /** True when this scan carries a neighbour table at all. */
  hasNeighbours = false;
  /** True when this scan carries a routing table at all. */
  hasRoutes = false;
  /** True when this scan carries each node's children. */
  hasAssociatedDevices = false;
  /**
   * A scan that carries the children table and nothing else: what
   * `GET /topology-scan-associated-devices` files.
   *
   * Its `neighbours` and `routes` are empty because they were never asked
   * for, which is not the same statement as a backend that cannot collect
   * them — so the tree is not merely the best view here, it is the only one.
   */
  treeOnly = false;

  /** Children claimed by more than one parent: devices that have reparented. */
  contestedChildren = 0;

  /**
   * The routes worked out for the selected node, and which way round they run.
   *
   * One control, and the direction follows from what is picked, because the
   * question is not symmetrical. Of a device, people ask how it gets *out* —
   * how this sensor reaches the controller. Of the coordinator, they ask how
   * it gets *in* to everything, which is one route per node rather than one
   * route. Asking for both ends separately would make the common question two
   * selections long.
   */
  paths: MeshPath[] = [];

  /** True while the graph is the document's fullscreen element. */
  isFullscreen = false;

  /** Rows whose endpoints are not in `nodes`, which the contract says cannot happen. */
  orphanRows = 0;

  visibleNodes = 0;
  visibleLinks = 0;
  visibleHops = 0;
  visibleChildLinks = 0;

  selectedNode: MeshNode;
  /** The selected node's ZDeviceID, when the device list has one for it. */
  selectedDeviceType: MeshDeviceType;
  selectedNeighbours: MeshNeighbourRow[] = [];
  selectedRoutes: Array<TopologyScanRoute & { roles: string[] }> = [];
  /** Nodes that declare the selected node as one of their children. */
  selectedParents: string[] = [];
  selectedChildren: string[] = [];
  /**
   * Whether the selected node answered with a child list at all.
   *
   * `null` and `[]` are two different statements in this payload and must not
   * be run together: the first is "this scan does not carry the table", the
   * second "this node was asked and declared no children".
   */
  selectedChildrenKnown = false;
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
  private routeGraph: MeshRouteGraph;
  /** Every node that claims a given nwkid as its child, by that child's nwkid. */
  private parentsById = new Map<string, string[]>();
  /**
   * True while the edge mode is one this component picked, not one the user did.
   *
   * It matters when the next scan arrives. A mode the user chose is theirs to
   * keep; a mode forced on them because the previous scan carried nothing else
   * has to be derived again, or opening a standalone Associated Devices
   * collection would leave every scan afterwards on the tree.
   */
  private modeForced = true;

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
      // After build(), which indexes the new scan, and after render(), which
      // is what the path is drawn onto.
      this.updatePath();
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
    // Esc and the browser's own chrome leave fullscreen without going through
    // the button, so the state is read off the event rather than toggled.
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.onFullscreenChange);
    this.render();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange);
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

  /** True when this browser will let an element go fullscreen. */
  get fullscreenSupported(): boolean {
    const target = document as any;
    return !!(document.fullscreenEnabled || target.webkitFullscreenEnabled);
  }

  /**
   * Fill the screen with the graph, and leave again.
   *
   * The Fullscreen API on the graph's own element, rather than a second
   * browser window: a window would have to fetch the scan again and would
   * open on the default filters, the default layout and no selection — so the
   * view somebody wants to see larger is precisely the one it could not show.
   */
  toggleFullscreen(): void {
    const element = this.graphShell?.nativeElement as any;
    const target = document as any;
    if (document.fullscreenElement || target.webkitFullscreenElement) {
      (document.exitFullscreen ?? target.webkitExitFullscreen)?.call(document);
      return;
    }
    const request = element?.requestFullscreen ?? element?.webkitRequestFullscreen;
    // A refusal is not an error worth reporting: the graph is still on the
    // page, at the size it was.
    Promise.resolve(request?.call(element)).catch((): void => undefined);
  }

  clearSelection(): void {
    this.selectedNode = undefined;
    this.selectedDeviceType = undefined;
    this.selectedLink = undefined;
    this.selectedHop = undefined;
    this.selectedNeighbours = [];
    this.selectedRoutes = [];
    this.selectedParents = [];
    this.selectedChildren = [];
    this.selectedChildrenKnown = false;
    this.cy?.elements().removeClass('faded highlighted');
  }

  /**
   * Keep the state and the graph's own measurements in step with the browser.
   *
   * Cytoscape measures its container when it is created and on resize events
   * only, and a fullscreen transition fires neither: without `resize()` the
   * graph keeps drawing into the box it had and the new space stays blank.
   */
  private readonly onFullscreenChange = (): void => {
    this.zone.run(() => {
      const target = document as any;
      const current = document.fullscreenElement ?? target.webkitFullscreenElement;
      this.isFullscreen = !!this.graphShell && current === this.graphShell.nativeElement;
      this.cy?.resize();
      this.fit();
      this.cdr.detectChanges();
    });
  };

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

  /** The mode the edge selector is on. */
  get edgeMode(): EdgeMode {
    return (this.form?.get('edges').value as EdgeMode) ?? 'neighbours';
  }

  /** True when the current mode draws neighbour links. */
  get drawsLinks(): boolean {
    return this.edgeMode === 'neighbours' || this.edgeMode === 'both';
  }

  /** True when the current mode draws routing hops. */
  get drawsHops(): boolean {
    return this.hasRoutes && (this.edgeMode === 'routes' || this.edgeMode === 'both');
  }

  /** True when the current mode draws the parent/child tree. */
  get drawsChildren(): boolean {
    return this.hasAssociatedDevices && this.edgeMode === 'children';
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
    // Per scan, never per source: zigpy's answer varies between two scans of
    // the same installation, and a standalone Associated Devices collection
    // carries one table where a full scan carries three.
    this.hasNeighbours = !!this.scan.tables?.includes('neighbours');
    this.hasRoutes = !!this.scan.tables?.includes('routes');
    this.hasAssociatedDevices = !!this.scan.tables?.includes('associated_devices');
    this.treeOnly = this.hasAssociatedDevices && !this.hasNeighbours && !this.hasRoutes;

    if (this.form) {
      // Two scans in a row need not carry the same tables, so a mode the new
      // scan cannot draw must not be left selected against the old one: it
      // would show an empty graph and blame the mesh for it.
      if (this.modeForced || !this.modeAvailable(this.edgeMode)) {
        this.form.get('edges').setValue(this.defaultMode(), { emitEvent: false });
        this.modeForced = true;
      }
      // A route is an answer about one scan. Carrying the chosen node over to
      // the next one is fine — it is the same mesh — but a node that scan
      // does not list is not, and neither is the old answer.
      this.resetPathNode();
      this.syncControlAvailability();
      return;
    }

    this.form = this.formBuilder.group({
      focusedNode: [null],
      layout: ['cose'],
      edges: [this.defaultMode()],
      showTree: [true],
      showSibling: [true],
      // none_of_above and previous_child: present in the payload, off by
      // default, as the API document suggests.
      showOther: [false],
      showUnknown: [true],
      // Both bounds inclusive, and a link neither end measured is outside no
      // window at all: `null` is not a reading, so it is not a value to
      // compare. See `applyFilters`.
      lqiRange: [[0, 255]],
      hideEndDevices: [false],
      hideIsolated: [false],
      showIcons: [true],
      // The coordinator to begin with: it is the node every mesh has, and
      // its view — how the controller reaches everything — is the one worth
      // opening on. Picking any other device switches to that device's route
      // out to the coordinator.
      pathNode: [this.scan.coordinator]
    });

    this.subs.sink = this.form.get('focusedNode').valueChanges.subscribe((nwkid: string) => this.focusNode(nwkid));
    this.subs.sink = this.form.get('layout').valueChanges.subscribe(() => this.runLayout());
    // Only a user's change reaches here: every programmatic one above passes
    // `emitEvent: false`.
    this.subs.sink = this.form.get('edges').valueChanges.subscribe(() => {
      this.modeForced = false;
      this.syncControlAvailability();
      this.applyFilters();
    });
    ['showTree', 'showSibling', 'showOther', 'showUnknown', 'lqiRange', 'hideEndDevices', 'hideIsolated'].forEach(
      name => {
        this.subs.sink = this.form.get(name).valueChanges.subscribe(() => this.applyFilters());
      }
    );
    // Icons are a drawing choice, not a filter: nothing is added to or taken
    // off the graph, so applyFilters() has no part in it.
    this.subs.sink = this.form.get('showIcons').valueChanges.subscribe(() => this.applyIcons());
    this.subs.sink = this.form.get('pathNode').valueChanges.subscribe(() => this.updatePath());
    this.syncControlAvailability();
  }

  /** Whether this scan carries the table a mode draws from. */
  private modeAvailable(mode: EdgeMode): boolean {
    switch (mode) {
      case 'neighbours':
        return this.hasNeighbours;
      case 'routes':
        return this.hasRoutes;
      case 'both':
        return this.hasNeighbours && this.hasRoutes;
      case 'children':
        return this.hasAssociatedDevices;
    }
  }

  /**
   * The mode to open a scan on.
   *
   * Neighbours when there are any, because that is the mesh as a radio
   * network. A standalone Associated Devices collection has none, and opening
   * it on a view it cannot draw would present it as an empty mesh rather than
   * as the tree it is.
   */
  private defaultMode(): EdgeMode {
    if (this.hasNeighbours) {
      return 'neighbours';
    }
    if (this.hasAssociatedDevices) {
      return 'children';
    }
    return this.hasRoutes ? 'routes' : 'neighbours';
  }

  /**
   * Grey out the controls the current mode cannot act on.
   *
   * Neither a routing-table row nor an Associated Devices row carries an LQI
   * or a relationship, so in those modes the LQI window and the four
   * relationship filters do nothing at all. Leaving them live is what made a
   * screen of orange routing hops read as a mesh with no link above LQI 100:
   * the legend was still advertising the LQI bands, and the window still
   * showed a range.
   */
  private syncControlAvailability(): void {
    const drawsLinks = this.drawsLinks;
    ['lqiRange', 'showTree', 'showSibling', 'showOther', 'showUnknown'].forEach(name => {
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
    this.childLinks = this.buildChildLinks(this.nodes);
    this.routeGraph = buildRouteGraph(scan);

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

  /**
   * Turn the nodes' `associated_devices` into parent -> child edges.
   *
   * The table is flat — one list of nwkids per node — so the edges are built
   * from the `nodes` collection rather than from a collection of their own,
   * and a child is resolved by joining it back against `nodes`: a child the
   * scan does not list is a device the plugin does not know, and is counted
   * with the other rows naming an absent node rather than drawn against
   * nothing.
   *
   * Nothing is deduplicated across parents on purpose. Two parents claiming
   * one child is a device that reparented and a stale entry left behind, and
   * drawing both edges is how that becomes visible.
   */
  private buildChildLinks(nodes: MeshNode[]): MeshChildLink[] {
    const parentsByChild = new Map<string, string[]>();
    const links: MeshChildLink[] = [];

    nodes.forEach(node => {
      // `null` is "this scan does not carry the table" and `[]` is "asked, and
      // declared no children"; neither produces an edge, so they are the same
      // thing here and only here.
      (node.associated_devices ?? []).forEach(child => {
        if (child === node.nwkid) {
          return;
        }
        if (!this.nodesById.has(child)) {
          this.orphanRows += 1;
          return;
        }
        const parents = parentsByChild.get(child) ?? [];
        if (parents.includes(node.nwkid)) {
          return;
        }
        parents.push(node.nwkid);
        parentsByChild.set(child, parents);
        links.push({ id: `child-${links.length}`, parent: node.nwkid, child, contested: false });
      });
    });

    this.parentsById = parentsByChild;
    this.contestedChildren = Array.from(parentsByChild.values()).filter(parents => parents.length > 1).length;
    links.forEach(link => {
      link.contested = (parentsByChild.get(link.child) ?? []).length > 1;
    });

    return links;
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

    this.drawPath();
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

    const children: cytoscape.ElementDefinition[] = this.childLinks.map(link => ({
      group: 'edges',
      data: {
        id: link.id,
        // Directed parent -> child: the arrow is the whole content of the row.
        source: link.parent,
        target: link.child,
        kind: 'child',
        contested: link.contested
      }
    }));

    return [...nodes, ...links, ...hops, ...children];
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

      {
        // The tree is directed too, and a parent -> child edge carries no LQI
        // either, so it is told apart the same way: its own colour and an
        // arrow, not an LQI band.
        selector: 'edge[kind = "child"]',
        style: {
          'line-color': COLOUR_CHILD,
          'line-style': 'solid',
          width: 2,
          'target-arrow-shape': 'triangle',
          'target-arrow-color': COLOUR_CHILD,
          'arrow-scale': 0.9
        }
      },
      {
        // A child two parents claim: both edges are drawn, and both are
        // marked, because which of the two is current cannot be told from
        // this table alone.
        selector: 'edge[kind = "child"][?contested]',
        style: { 'line-color': COLOUR_POOR, 'target-arrow-color': COLOUR_POOR, 'line-style': 'dashed' }
      },

      {
        // The computed path is drawn over whatever else is on screen: it is
        // an answer about the mesh rather than another table of it, so it has
        // to read as a layer rather than as one more kind of link.
        selector: 'edge[kind = "path"]',
        style: {
          'line-color': COLOUR_PATH,
          'line-style': 'solid',
          'curve-style': 'bezier',
          width: 6,
          opacity: 0.9,
          'target-arrow-shape': 'triangle',
          'target-arrow-color': COLOUR_PATH,
          'arrow-scale': 1.1,
          'z-index': 100
        }
      },
      {
        // An estimated hop is dashed, and that is the whole point of the
        // feature: a hop the routing tables stated and a hop this page worked
        // out must never look the same.
        selector: 'edge[kind = "path"][?estimated]',
        style: { 'line-style': 'dashed', opacity: 0.85 }
      },
      {
        selector: 'node.on-path',
        style: { 'border-color': COLOUR_PATH, 'border-width': 4, 'border-style': 'solid', 'z-index': 100 }
      },

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
    const drawsLinks = this.drawsLinks;
    const drawsHops = this.drawsHops;
    const drawsChildren = this.drawsChildren;
    const kinds: Record<MeshLinkKind, boolean> = {
      tree: !!this.form.get('showTree').value,
      sibling: !!this.form.get('showSibling').value,
      other: !!this.form.get('showOther').value,
      unknown: !!this.form.get('showUnknown').value
    };
    const [lqiMin, lqiMax] = (this.form.get('lqiRange').value as number[]) ?? [0, 255];
    const hideEndDevices = !!this.form.get('hideEndDevices').value;
    const hideIsolated = !!this.form.get('hideIsolated').value;

    this.cy.batch(() => {
      this.cy.nodes().forEach(node => {
        node.toggleClass('hidden', hideEndDevices && node.data('type') === 'end_device');
      });

      this.cy.edges().forEach(edge => {
        const kind = edge.data('kind') as MeshLinkKind | 'route' | 'child' | 'path';
        let hidden: boolean;

        if (kind === 'path') {
          // The path is not one of the three tables and is not filtered with
          // them: it was asked for explicitly, and a filter silently removing
          // part of the answer is worse than a busy picture.
          hidden = false;
        } else if (kind === 'route') {
          hidden = !drawsHops;
        } else if (kind === 'child') {
          hidden = !drawsChildren;
        } else {
          // A link neither end measured has no reading to compare with the
          // window, so the window does not apply to it: `null` is not a low
          // LQI, and hiding it would be a filter on a measurement that was
          // never made.
          const outsideWindow =
            !!edge.data('hasLqi') && (Number(edge.data('lqi')) < lqiMin || Number(edge.data('lqi')) > lqiMax);
          hidden = !drawsLinks || !kinds[kind] || outsideWindow;
        }

        edge.toggleClass(
          'hidden',
          kind !== 'path' && (hidden || edge.source().hasClass('hidden') || edge.target().hasClass('hidden'))
        );
      });

      // A node the path goes through is part of the answer, so no filter may
      // take it off the picture while the path is drawn.
      this.cy.nodes('.on-path').removeClass('hidden');

      if (hideIsolated) {
        // Cytoscape's selector grammar has no `:not()`, and an unparsable
        // selector matches everything rather than failing, so the class is
        // subtracted with `not()` instead.
        this.cy
          .nodes()
          .not('.hidden')
          .forEach(node => {
            node.toggleClass('hidden', !node.hasClass('on-path') && node.connectedEdges().not('.hidden').empty());
          });
      }
    });

    this.visibleNodes = this.cy.nodes().not('.hidden').length;
    this.visibleLinks = this.cy.edges('[kind != "route"][kind != "child"][kind != "path"]').not('.hidden').length;
    this.visibleHops = this.cy.edges('[kind = "route"]').not('.hidden').length;
    this.visibleChildLinks = this.cy.edges('[kind = "child"]').not('.hidden').length;
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
      return;
    }
    // A parent -> child edge has nothing to put in a panel that the two nodes
    // do not already say, so selecting one highlights it and leaves the panel
    // alone rather than opening an empty card.
    this.clearSelection();
    this.highlightEdge(id);
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
    this.selectedParents = this.parentsById.get(nwkid) ?? [];
    this.selectedChildren = node.associated_devices ?? [];
    this.selectedChildrenKnown = Array.isArray(node.associated_devices);

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
    this.selectedParents = [];
    this.selectedChildren = [];
    this.selectedChildrenKnown = false;
    this.selectedLink = link;
    this.highlightEdge(link.id);
  }

  private selectHop(hop: MeshRouteHop): void {
    this.selectedNode = undefined;
    this.selectedDeviceType = undefined;
    this.selectedLink = undefined;
    this.selectedNeighbours = [];
    this.selectedRoutes = [];
    this.selectedParents = [];
    this.selectedChildren = [];
    this.selectedChildrenKnown = false;
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

  // -- the computed route ---------------------------------------------------

  /** The node the route view is centred on. */
  get pathNode(): string | null {
    return (this.form?.get('pathNode').value as string) ?? null;
  }

  /**
   * True while the coordinator is the chosen node, which is the fan-out view.
   *
   * The two views answer different questions and are labelled differently, so
   * the template asks this rather than counting the paths: one route out of a
   * mesh with a single router is also one path.
   */
  get pathFromCoordinator(): boolean {
    return !!this.pathNode && this.pathNode === this.scan?.coordinator;
  }

  /** The single route, when a device rather than the coordinator is chosen. */
  get path(): MeshPath | undefined {
    return this.pathFromCoordinator ? undefined : this.paths[0];
  }

  /** `true` while there is at least one hop to show. */
  get hasPath(): boolean {
    return this.paths.some(path => path.hops.length > 0);
  }

  /** Hops the LQI estimate had to supply, over every route on screen. */
  get estimatedHops(): number {
    return this.paths.reduce((total, path) => total + path.estimatedHops, 0);
  }

  /** Routes that no routing row contributed to. */
  get estimatedPaths(): number {
    return this.paths.filter(path => path.outcome === 'estimate').length;
  }

  /** True when any route on screen leans on a concentrator the scan cannot read. */
  get pathManyToOne(): boolean {
    return this.paths.some(path => path.manyToOne);
  }

  /** Back to the coordinator's view, which is where the page opens. */
  clearPath(): void {
    this.form?.get('pathNode').setValue(this.scan?.coordinator ?? null);
  }

  /** Work the routes out again, against the scan on screen. */
  recomputePath(): void {
    this.updatePath();
  }

  /** Centre the route view on a node, from the node panel. */
  routeFrom(nwkid: string): void {
    this.form?.get('pathNode').setValue(nwkid);
  }

  private resetPathNode(): void {
    if (!this.pathNode || !this.nodesById.has(this.pathNode)) {
      this.form.get('pathNode').setValue(this.scan.coordinator, { emitEvent: false });
    }
    this.paths = [];
  }

  /**
   * Work out the routes for the chosen node and put them on the graph.
   *
   * Everything this needs is in the scan already — both directions of every
   * neighbour link, the routing rows with their next hop and status, and the
   * children each router declared — so it asks the plugin for nothing and
   * costs the mesh nothing.
   */
  private updatePath(): void {
    const node = this.pathNode;
    const coordinator = this.scan?.coordinator;

    if (!node || !this.routeGraph || !coordinator) {
      this.paths = [];
    } else if (node === coordinator) {
      // Outward: how the controller reaches each device.
      this.paths = computePathsFrom(
        this.routeGraph,
        node,
        this.nodes.map(candidate => candidate.nwkid)
      );
    } else {
      // Inward: how this device reaches the controller.
      this.paths = [computePath(this.routeGraph, node, coordinator)];
    }

    this.drawPath();
    this.cdr.detectChanges();
  }

  /**
   * Replace the route edges on the graph.
   *
   * They are elements of their own rather than a class on the links already
   * drawn, because a hop need not be drawn at all in the current mode: a hop
   * taken from a routing table has no neighbour link to mark while the
   * neighbour view is on screen, and the reverse holds in the routing view.
   * Adding them keeps the answer whole whatever the mode.
   *
   * The coordinator's view walks many routes over the same first few hops, so
   * an edge is drawn once. An edge that is observed on one route and
   * estimated on another is drawn as observed: it is on a routing row
   * somewhere, and the dash is reserved for a hop nothing reported.
   */
  private drawPath(): void {
    if (!this.cy) {
      return;
    }

    const edges = new Map<string, { from: string; to: string; estimated: boolean }>();
    this.paths.forEach(path =>
      path.hops.forEach(step => {
        if (!this.nodesById.has(step.from) || !this.nodesById.has(step.to)) {
          return;
        }
        const key = `${step.from}\u0000${step.to}`;
        const estimated = step.source === 'estimate';
        const existing = edges.get(key);
        edges.set(key, { from: step.from, to: step.to, estimated: (existing?.estimated ?? true) && estimated });
      })
    );

    this.zone.runOutsideAngular(() => {
      this.cy.batch(() => {
        this.cy.remove('edge[kind = "path"]');
        this.cy.nodes().removeClass('on-path');

        Array.from(edges.values()).forEach((edge, index) => {
          this.cy.add({
            group: 'edges',
            data: {
              id: `path-${index}`,
              source: edge.from,
              target: edge.to,
              kind: 'path',
              estimated: edge.estimated
            }
          });
          this.cy.getElementById(edge.from).addClass('on-path');
          this.cy.getElementById(edge.to).addClass('on-path');
        });
      });

      // The new edges have to go through the filters once, so that the nodes
      // they pass through are brought back if a filter had hidden them.
      this.applyFilters();
    });
  }
}
