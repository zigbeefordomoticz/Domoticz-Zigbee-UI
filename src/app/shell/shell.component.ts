import { Component, OnInit } from '@angular/core';
import { LoaderService } from '@app/services/loader.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
})
export class ShellComponent implements OnInit {
  constructor(private loader: LoaderService, private spinner: NgxSpinnerService) {}

  ngOnInit() {
    this.loader.loader$.subscribe(show => (show ? this.spinner.show() : this.spinner.hide()));
  }
}
