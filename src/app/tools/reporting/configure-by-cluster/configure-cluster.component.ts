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
            clusterToDisplay.change = infos.Change;
            clusterToDisplay.dataType = infos.DataType;
            clusterToDisplay.maxInterval = infos.MaxInterval;
            clusterToDisplay.minInterval = infos.MinInterval;
            clusterToDisplay.timeOut = infos.TimeOut;
            this.clustersToDisplay.push(clusterToDisplay);
          });
        });
      });
    }
  }

  updateValue(event: any, previousValue: string, col: string, clusterToDisplay: ClusterToDisplay, index: number) {
    const expression = /^([0-9a-fA-F]+)$/i;
    const value = event.target.value.trim() as string;
    if (expression.test(value)) {
      const rowUpdated = this.clusters
        .find(cluster => cluster.ClusterId === clusterToDisplay.clusterId)
        .Attributes.find(attribute => attribute.Attribute === clusterToDisplay.attributeId)
        .Infos.find(infos => infos.DataType === clusterToDisplay.dataType);
      if (previousValue.length === value.length) {
        rowUpdated[col] = value;
        this.clustersChange.emit(this.clusters);
      } else {
        this.clustersChange.emit(null);
        alert(this.translate.instant('reporting.configure.length.error'));
      }
    } else {
      this.clustersChange.emit(null);
      alert(this.translate.instant('reporting.configure.hexa.error'));
    }
  }
}
