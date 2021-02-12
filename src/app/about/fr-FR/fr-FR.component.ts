import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';

@Component({
  selector: 'app-about-fr',
  templateUrl: './fr-FR.component.html',
  styleUrls: ['./fr-FR.component.scss']
})
export class AboutFrComponent implements OnInit {
  version: string = environment.version;

  constructor() {}

  ngOnInit() {}
}
