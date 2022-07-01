import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Logger } from '@app/core';
import { ApiService } from '@app/services/api.service';
import { ClusterToDisplay, Configure } from '@app/shared/models/configure-reporting';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

const log = new Logger('ConfigureByClusterReportingComponent');

@Component({
  selector: 'app-configure-cluster-reporting',
  templateUrl: './configure-cluster.component.html',
  styleUrls: ['./configure-cluster.component.scss']
})
export class ConfigureByClusterReportingComponent implements OnChanges {
  @ViewChild('table') table: any;
  @Input() clusters: Configure[];
  @Output() clustersChange = new EventEmitter<Configure[]>();

  clustersToDisplay: ClusterToDisplay[] = [];

  datatypeConvertor: any = [
    { type: '20', longueur: '0' },
    { type: '10', longueur: '0' },
    { type: '21', longueur: '00' },
    { type: '22', longueur: '000' },
    { type: '23', longueur: '0000' },
    { type: '24', longueur: '00000' },
    { type: '25', longueur: '000000' },
    { type: '26', longueur: '0000000' },
    { type: '27', longueur: '00000000' },
    { type: '28', longueur: '0' },
    { type: '29', longueur: '00' },
    { type: '2a', longueur: '000' },
    { type: '2b', longueur: '0000' },
    { type: '2c', longueur: '00000' },
    { type: '2d', longueur: '000000' },
    { type: '2e', longueur: '0000000' },
    { type: '2f', longueur: '00000000' },
    { type: '38', longueur: '00' },
    { type: '39', longueur: '0000' },
    { type: '3a', longueur: '00000000' },
    { type: 'e0', longueur: '0000' },
    { type: 'e1', longueur: '0000' },
    { type: 'e2', longueur: '0000' }
  ];

  constructor(
    private toastr: ToastrService,
    private apiService: ApiService,
    private formBuilder: FormBuilder,
    private translate: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.clusters.currentValue) {
      this.clustersToDisplay = [];
      const clusters: Configure[] = changes.clusters.currentValue;
      clusters.forEach(cluster => {
        cluster.Attributes.forEach(attribute => {
          attribute.Infos.forEach(infos => {
            const clusterToDisplay = new ClusterToDisplay();
            clusterToDisplay.clusterId = cluster.ClusterId;
            clusterToDisplay.attributeId = attribute.Attribute;
            clusterToDisplay.change = parseInt(infos.Change, 16).toString();
            clusterToDisplay.dataType = infos.DataType;
            clusterToDisplay.maxInterval = parseInt(infos.MaxInterval, 16).toString();
            clusterToDisplay.minInterval = parseInt(infos.MinInterval, 16).toString();
            clusterToDisplay.timeOut = parseInt(infos.TimeOut, 16).toString();
            this.clustersToDisplay.push(clusterToDisplay);
          });
        });
      });
    }
  }

  updateValue(event: any, previousValue: string, col: string, clusterToDisplay: ClusterToDisplay, index: number) {
    const value = event.target.value as number;
    if (isNaN(value)) {
      this.clustersChange.emit(null);
      alert(this.translate.instant('reporting.configure.hexa.error'));
    } else if (value > 65535) {
      this.clustersChange.emit(null);
      alert(this.translate.instant('reporting.configure.length.error'));
    } else {
      const rowUpdated = this.clusters
        .find(cluster => cluster.ClusterId === clusterToDisplay.clusterId)
        .Attributes.find(attribute => attribute.Attribute === clusterToDisplay.attributeId).Infos[0];
      if (col === 'Change') {
        const type = this.datatypeConvertor.find((datatype: any) => datatype.type === rowUpdated.DataType);
        if (type.type === '10' && value > 1) {
          this.clustersChange.emit(null);
          alert(this.translate.instant('reporting.configure.length.error'));
        }
        const longueur = type.longueur;
        rowUpdated[col] = (type.longueur + Number(value).toString(16).toUpperCase()).slice(
          (type.longueur as string).length
        );
      } else {
        rowUpdated[col] = Number(value).toString(16).toUpperCase();
      }
      this.clustersChange.emit(this.clusters);
    }
  }
}
