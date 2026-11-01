import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';

const VIEWS = ['mesh', 'topology', 'interference'];

/**
 * The Network page: key figures, then one tab per view.
 *
 * Mesh graph and Topology are the pages that used to have their own menu entry, unchanged;
 * Interference level is NetworkInterferenceComponent.
 */
@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
  standalone: false
})
export class NetworkComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  view: string;

  constructor(private activatedRoute: ActivatedRoute) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.activatedRoute.queryParamMap.subscribe(params => {
      // The menu and the figures link here with ?view=mesh|topology|interference; none, or an unknown one, opens Mesh
      const view = params.get('view');
      this.view = VIEWS.includes(view) ? view : 'mesh';
    });
  }
}
