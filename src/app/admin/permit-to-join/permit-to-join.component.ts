import { Component, OnInit } from '@angular/core';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('PermitToJoinComponent');

@Component({
  selector: 'app-permit-to-join',
  templateUrl: './permit-to-join.component.html',
  styleUrls: ['./permit-to-join.component.scss']
})
export class PermitToJoinComponent implements OnInit {
  permitToJoin: any;

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.apiService.getPermitToJoin().subscribe(result => {
      this.permitToJoin = result;
    });
  }

  updatePermitToJoin(value: number) {
    this.permitToJoin.PermitToJoin = value;
    this.apiService.putPermitToJoin(this.permitToJoin).subscribe((result: any) => {
      switch (value) { 
        case 255: { 
          this.toastr.success(this.translate.instant('admin.permittojoin.permanent.notify'));
          break; 
        } 
        case 240: { 
          this.toastr.success(this.translate.instant('admin.permittojoin.4min.notify')); 
          break; 
        } 
        case 0: { 
          this.toastr.success(this.translate.instant('admin.permittojoin.stop.notify')); 
          break; 
       } 
        default: { 
          this.toastr.success(this.translate.instant('api.global.succes.commandsent.notify')); 
          break; 
        } 
      } 
    });
  }
}
