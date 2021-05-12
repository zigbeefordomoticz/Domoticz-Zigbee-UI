import { Component, OnInit } from '@angular/core';
import { environment } from '@env/environment';

@Component({
  selector: 'app-about-en',
  templateUrl: './en-US.component.html',
  styleUrls: ['./en-US.component.scss']
})
export class AboutEnComponent implements OnInit {
  version: string = environment.version;

  constructor() {}

  ngOnInit() {}
}
