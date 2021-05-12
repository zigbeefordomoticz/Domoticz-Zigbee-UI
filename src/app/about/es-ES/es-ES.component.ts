import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';

@Component({
  selector: 'app-about-es',
  templateUrl: './es-ES.component.html',
  styleUrls: ['./es-ES.component.scss'],
})
export class AboutEsComponent implements OnInit {
  version: string = environment.version;

  constructor() {}

  ngOnInit() {}
}
