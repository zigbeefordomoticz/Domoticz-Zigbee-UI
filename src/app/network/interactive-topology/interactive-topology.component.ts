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
import { ApiService } from '@app/services/api.service';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';
import { DeviceByName } from '@app/shared/models/device-by-name';
import { Relation } from '@app/shared/models/relation';
import cytoscape from 'cytoscape';
import { Observable, combineLatest } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { TopologyDeviceType, TopologyGraphLink, TopologyGraphNode, TopologyNeighbour } from './topology-graph.model';

/** Name the plugin gives the coordinator in every topology report. */
const COORDINATOR = 'Zigbee Coordinator';

/** LQI bands, as agreed on issue #167. */
const LQI_POOR_MAX = 100;
const LQI_FAIR_MAX = 174;

/** Bootstrap $red / $blue / $green from src/main.scss, so the graph matches the theme. */
const LQI_COLOUR_POOR = '#dc3545';
const LQI_COLOUR_FAIR = '#0073dd';
const LQI_COLOUR_GOOD = '#28a745';

/** Health value the plugin sets on a node it can no longer reach. */
const HEALTH_UNREACHABLE = 'Not Reachable';

@Component({
  selector: 'app-interactive-topology',
  templateUrl: './interactive-topology.component.html',
  styleUrls: ['./interactive-topology.component.scss'],
  standalone: false
})
export class InteractiveTopologyComponent extends UnsubscribeOnDestroyAdapter implements OnChanges, AfterViewInit {
  @Input() timeStamp: string;
  @ViewChild('graph') graphContainer: ElementRef<HTMLDivElement>;

  form: FormGroup;
  layouts = ['cose', 'concentric', 'breadthfirst', 'circle', 'grid'];

  nodes: TopologyGraphNode[] = [];
  links: TopologyGraphLink[] = [];

  selectedNode: TopologyGraphNode;
  selectedNodeNeighbours: TopologyNeighbour[] = [];
  selectedLink: TopologyGraphLink;

  loading = false;
  nodeCount = 0;
  linkCount = 0;

  /** Exposed to the template for the legend. */
  readonly lqiPoorMax = LQI_POOR_MAX;
  readonly lqiFairMax = LQI_FAIR_MAX;

  private cy: cytoscape.Core;
  private viewReady = false;
  private devices$: Observable<DeviceByName[]>;
  private nodesById = new Map<string, TopologyGraphNode>();

  constructor(
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.timeStamp || changes.timeStamp.currentValue === changes.timeStamp.previousValue) {
      return;
    }
    this.buildForm();
    this.load();
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
    if (!this.cy) {
      return;
    }
    this.zone.runOutsideAngular(() => this.applyLayout());
  }

  clearSelection(): void {
    this.selectedNode = undefined;
    this.selectedLink = undefined;
    this.selectedNodeNeighbours = [];
    this.cy?.elements().removeClass('faded highlighted');
  }

  /** Colour of an LQI value, shared by the graph stylesheet and the detail panels. */
  lqiColour(lqi: number): string {
    if (lqi <= LQI_POOR_MAX) {
      return LQI_COLOUR_POOR;
    }
    return lqi <= LQI_FAIR_MAX ? LQI_COLOUR_FAIR : LQI_COLOUR_GOOD;
  }

  private buildForm(): void {
    if (this.form) {
      return;
    }
    this.form = this.formBuilder.group({
      focusedNode: [null],
      layout: ['cose'],
      lqiThreshold: [0],
      hideEndDevices: [false]
    });

    this.subs.sink = this.form.get('focusedNode').valueChanges.subscribe((name: string) => this.focusNode(name));
    this.subs.sink = this.form.get('layout').valueChanges.subscribe(() => this.runLayout());
    this.subs.sink = this.form.get('lqiThreshold').valueChanges.subscribe(() => this.applyFilters());
    this.subs.sink = this.form.get('hideEndDevices').valueChanges.subscribe(() => this.applyFilters());
  }

  private load(): void {
    // The device list does not depend on the report, so fetch it once and
    // replay it for every timestamp the user clicks through.
    this.devices$ ??= this.apiService.getZDeviceName().pipe(shareReplay(1));

    this.loading = true;
    this.subs.sink = combineLatest([this.apiService.getTopologieByTimeStamp(this.timeStamp), this.devices$]).subscribe(
      ([relations, devices]) => {
        this.build(relations ?? [], devices ?? []);
        this.loading = false;
        this.clearSelection();
        this.render();
        this.cdr.detectChanges();
      }
    );
  }

  /**
   * Join the topology report with the device list.
   *
   * The report gives one entry per reported neighbour relation, with the LQI
   * the *Father* recorded for the *Child* and the Child's device type. The
   * device list gives everything else a node panel needs.
   */
  private build(relations: Relation[], devices: DeviceByName[]): void {
    const byName = new Map<string, DeviceByName>();
    devices.forEach(device => {
      // get_node_name() falls back to the NwkId when a device has no name, so
      // a report can refer to a device either way.
      if (device.ZDeviceName) {
        byName.set(device.ZDeviceName, device);
      }
      if (device._NwkId) {
        byName.set(device._NwkId, device);
      }
    });

    const types = new Map<string, TopologyDeviceType>();
    const linksByPair = new Map<string, TopologyGraphLink>();
    const names = new Set<string>();

    relations.forEach(relation => {
      const father = relation.Father;
      const child = relation.Child;
      if (!father || !child || father === child) {
        return;
      }
      names.add(father);
      names.add(child);

      // DeviceType in the payload describes the Child of the relation, never
      // the Father. See rest_Topology.build_relation_ship_dict() in the plugin.
      if (relation.DeviceType) {
        types.set(child, this.normaliseDeviceType(relation.DeviceType));
      }

      const lqi = Number(relation._lnkqty) || 0;
      // The report lists A->B and B->A separately. Collapse them onto one link
      // and keep both readings so the link panel can show the asymmetry.
      const pair = [father, child].sort();
      const key = pair.join('\u0000');
      const existing = linksByPair.get(key);
      const forward = pair[0] === father;

      if (existing) {
        if (forward) {
          existing.lqiReportedBySource = lqi;
        } else {
          existing.lqiReportedByTarget = lqi;
        }
        existing.lqi = Math.max(existing.lqi, lqi);
        return;
      }

      linksByPair.set(key, {
        id: `link-${linksByPair.size}`,
        source: pair[0],
        target: pair[1],
        lqi,
        lqiReportedBySource: forward ? lqi : undefined,
        lqiReportedByTarget: forward ? undefined : lqi
      });
    });

    this.nodes = Array.from(names).map(name => {
      const device = byName.get(name);
      return {
        id: name,
        deviceType: this.deviceTypeOf(name, types.get(name), device),
        ieee: device?.IEEE,
        nwkId: device?._NwkId,
        model: device?.Model,
        health: device?.Health,
        status: device?.Status,
        // The plugin sends '' for a mains-powered device; treat that as absent
        // so the panel shows a dash rather than a blank cell.
        battery: device?.Battery === '' ? undefined : device?.Battery,
        lqi: device?.LQI,
        rssi: device?.RSSI
      };
    });

    this.links = Array.from(linksByPair.values());
    this.nodesById = new Map(this.nodes.map(node => [node.id, node]));
    this.nodeCount = this.nodes.length;
    this.linkCount = this.links.length;
  }

  private deviceTypeOf(name: string, reported: TopologyDeviceType, device: DeviceByName): TopologyDeviceType {
    if (name === COORDINATOR) {
      return 'Coordinator';
    }
    if (reported && reported !== 'Unknown') {
      return reported;
    }
    // A node that is only ever a Father in the report has no DeviceType of its
    // own, so fall back to the MAC capability flags from the device list.
    if (device?.MacCapa?.includes('FFD')) {
      return 'Router';
    }
    if (device?.MacCapa?.includes('RFD')) {
      return 'End Device';
    }
    return 'Unknown';
  }

  private normaliseDeviceType(deviceType: string): TopologyDeviceType {
    switch (deviceType) {
      case 'Coordinator':
        return 'Coordinator';
      case 'Router':
        return 'Router';
      case 'End Device':
        return 'End Device';
      default:
        return 'Unknown';
    }
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
        this.zone.run(() => this.selectLink(id));
      });
      this.cy.on('tap', event => {
        if (event.target === this.cy) {
          this.zone.run(() => this.clearSelection());
        }
      });

      this.applyFilters();
      this.applyLayout();
    });
  }

  private elements(): cytoscape.ElementDefinition[] {
    const nodes: cytoscape.ElementDefinition[] = this.nodes.map(node => ({
      group: 'nodes',
      data: {
        id: node.id,
        label: node.id,
        deviceType: node.deviceType,
        unreachable: node.health === HEALTH_UNREACHABLE
      }
    }));

    const edges: cytoscape.ElementDefinition[] = this.links.map(link => ({
      group: 'edges',
      data: {
        id: link.id,
        source: link.source,
        target: link.target,
        lqi: link.lqi,
        colour: this.lqiColour(link.lqi),
        width: link.lqi <= LQI_POOR_MAX ? 1 : link.lqi <= LQI_FAIR_MAX ? 2 : 3
      }
    }));

    return [...nodes, ...edges];
  }

  private stylesheet(): cytoscape.StylesheetJson {
    return [
      {
        selector: 'node',
        style: {
          // Rectangle for anything that routes, ellipse for an end device.
          shape: 'ellipse',
          'background-color': '#868e96',
          'border-width': 2,
          'border-color': '#495057',
          width: 22,
          height: 22,
          label: 'data(label)',
          'font-size': 9,
          'text-valign': 'bottom',
          'text-margin-y': 3,
          'text-background-color': '#fff',
          'text-background-opacity': 0.75,
          'text-background-padding': '1px',
          color: '#212529'
        }
      },
      {
        selector: 'node[deviceType = "Router"]',
        style: { shape: 'round-rectangle', 'background-color': '#0073dd', width: 34, height: 22 }
      },
      {
        selector: 'node[deviceType = "Coordinator"]',
        style: {
          shape: 'round-rectangle',
          'background-color': '#6f42c1',
          width: 52,
          height: 30,
          'font-size': 11,
          'font-weight': 'bold'
        }
      },
      {
        selector: 'node[deviceType = "End Device"]',
        style: { 'background-color': '#20c997' }
      },
      {
        selector: 'node[?unreachable]',
        style: { 'background-color': LQI_COLOUR_POOR, 'border-color': LQI_COLOUR_POOR, 'border-width': 3 }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'straight',
          'line-color': 'data(colour)',
          width: 'data(width)',
          opacity: 0.65
        }
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
      // Anchor the hierarchy on the coordinator rather than an arbitrary node.
      const coordinator = this.cy.getElementById(COORDINATOR);
      if (coordinator.nonempty()) {
        if (name === 'breadthfirst') {
          options.roots = coordinator;
        } else {
          options.concentric = (node: cytoscape.NodeSingular) => (node.id() === COORDINATOR ? 10 : node.degree(false));
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
    const threshold = Number(this.form.get('lqiThreshold').value) || 0;
    const hideEndDevices = !!this.form.get('hideEndDevices').value;

    this.cy.batch(() => {
      this.cy.nodes().forEach(node => {
        const hidden = hideEndDevices && node.data('deviceType') === 'End Device';
        node.toggleClass('hidden', hidden);
      });
      this.cy.edges().forEach(edge => {
        const belowThreshold = Number(edge.data('lqi')) < threshold;
        const endpointHidden = edge.source().hasClass('hidden') || edge.target().hasClass('hidden');
        edge.toggleClass('hidden', belowThreshold || endpointHidden);
      });
    });
  }

  private selectNode(id: string): void {
    const node = this.nodesById.get(id);
    if (!node) {
      return;
    }
    this.selectedLink = undefined;
    this.selectedNode = node;
    this.selectedNodeNeighbours = this.neighboursOf(id);
    this.highlight(id);
  }

  private selectLink(id: string): void {
    const link = this.links.find(candidate => candidate.id === id);
    if (!link) {
      return;
    }
    this.selectedNode = undefined;
    this.selectedNodeNeighbours = [];
    this.selectedLink = link;

    this.cy.elements().addClass('faded').removeClass('highlighted');
    const edge = this.cy.getElementById(id);
    edge.removeClass('faded').addClass('highlighted');
    edge.connectedNodes().removeClass('faded').addClass('highlighted');
  }

  private neighboursOf(id: string): TopologyNeighbour[] {
    return this.links
      .filter(link => link.source === id || link.target === id)
      .map(link => {
        const name = link.source === id ? link.target : link.source;
        const neighbour = this.nodesById.get(name);
        return {
          name,
          lqi: link.lqi,
          deviceType: neighbour?.deviceType ?? 'Unknown',
          model: neighbour?.model,
          health: neighbour?.health
        };
      })
      .sort((a, b) => b.lqi - a.lqi);
  }

  private focusNode(name: string): void {
    if (!name || !this.cy) {
      return;
    }
    const node = this.cy.getElementById(name);
    if (node.empty()) {
      return;
    }
    this.cy.animate({ center: { eles: node }, zoom: 1.2, duration: 250 });
    this.selectNode(name);
  }

  private highlight(id: string): void {
    if (!this.cy) {
      return;
    }
    const node = this.cy.getElementById(id);
    const neighbourhood = node.closedNeighborhood();
    this.cy.batch(() => {
      this.cy.elements().addClass('faded').removeClass('highlighted');
      neighbourhood.removeClass('faded').addClass('highlighted');
    });
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
