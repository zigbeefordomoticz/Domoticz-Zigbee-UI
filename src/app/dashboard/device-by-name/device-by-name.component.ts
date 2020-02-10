import { Component, OnInit, ViewChild } from '@angular/core';
import { ControlContainer, FormGroupDirective } from '@angular/forms';
import { Logger } from '@app/core';
import { ToppyControl } from 'toppy';

const log = new Logger('DeviceByNameComponent');

@Component({
  selector: 'app-dashboard-device-by-name',
  templateUrl: './device-by-name.component.html',
  styleUrls: ['./device-by-name.component.scss'],
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective
    }
  ]
})
export class DeviceByNameComponent implements OnInit {
  @ViewChild('table') table: any;
  devices: any;
  rows: any = [];
  close: any;

  constructor(private overlay: ToppyControl) {
    this.rows = this.overlay.content.props.devices;
  }

  ngOnInit() {}

  dismiss() {
    this.close(); // auto binded
  }
}
