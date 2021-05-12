import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';

@Component({
  selector: 'app-about-nl',
  templateUrl: './nl-NL.component.html',
  styleUrls: ['./nl-NL.component.scss']
})
export class AboutNlComponent implements OnInit {
  version: string = environment.version;

  constructor() {}

  ngOnInit() {}
}
