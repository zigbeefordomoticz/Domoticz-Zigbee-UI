import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UnsubscribeOnDestroyAdapter } from '@app/shared/adapter/unsubscribe-adapter';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent extends UnsubscribeOnDestroyAdapter implements OnInit {
  action: string;

  constructor(private activatedRoute: ActivatedRoute) {
    super();
  }

  ngOnInit() {
    this.subs.sink = this.activatedRoute.queryParamMap.subscribe(params => {
      this.action = params.get('action');
    });
  }
}
