import { Component, OnInit } from '@angular/core';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { pluck } from 'rxjs/operators';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

@Component({
  selector: 'app-all-pipelines',
  templateUrl: './all-pipelines.component.html',
  styleUrls: ['./all-pipelines.component.css'],
})
export class AllPipelinesComponent implements OnInit {
  logstashPipelines: any = [];
  mongoPipelines: any = [];
  public rowSelection = 'single';
  private gridApi!: GridApi;
  columnDefs: ColDef[] = [
    {
      field: 'pipeline_name',
      filter: true,
    },
    { field: 'index_name', filter: true },
    { field: 'table_name', filter: true },
    { field: 'db_name', filter: true },
    { field: 'last_modified', filter: true },
  ];

  columnDefsMongoPipelines: ColDef[] = [
    {
      field: 'pipeline_id',
      filter: true,
    },
    { field: 'index_name', filter: true },
    { field: 'db_name', filter: true },
    { field: 'collection_name', filter: true },
    { field: 'fields_to_be_indexed', filter: true },
    { field: 'is_batch_process_completed', filter: true },
    { field: 'batch_size', filter: true },
  ];

  constructor(private _es: EsManagementService) {}

  ngOnInit(): void {
    this.getLogstashPipelines();
    this.getMongoPipelines();
  }

  getLogstashPipelines = () => {
    this._es
      .getLogstashPipelines()
      .pipe(pluck('data'))
      .subscribe({
        next: (res) => {
          this.logstashPipelines = res;
        },
        error: (err) => {
          console.log(err);
        },
      });
  };

  getMongoPipelines() {
    this._es
      .getMongoPipelines()
      .pipe(pluck('data'))
      .subscribe({
        next: (res) => {
          this.mongoPipelines = res;
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  onSelectionChanged(event: any) {
    console.log(this.gridApi.getSelectedRows());
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }
}
