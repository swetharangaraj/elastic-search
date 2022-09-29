import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { SocketService } from 'projects/elk-web-client/src/services/socket.service';
import { pluck } from 'rxjs/operators';
@Component({
  selector: 'app-all-indices',
  templateUrl: './all-indices.component.html',
  styleUrls: ['./all-indices.component.css'],
})
export class AllIndicesComponent implements OnInit {
  public rowSelection = 'multiple';
  columnDefs: ColDef[] = [
    {
      field: 'index_name',
      sortable: true,
      filter: true,
      checkboxSelection: true,
    },
    { field: 'database_type', sortable: true, filter: true },
    { field: 'db_name', sortable: true, filter: true },
    { field: 'table_name', sortable: true, filter: true },
    { field: 'pipeline_type', sortable: true, filter: true },
    { field: 'pipeline_id', sortable: true, filter: true },
    { field: 'ingestion_mode', sortable: true, filter: true },
    { field: 'executed_on', sortable: true, filter: true },
    { field: 'app_name', sortable: true, filter: true },
  ];
  selectedRows: any = [];
  columnDefsStats: ColDef[] = [
    {
      field: 'index',
      sortable: true,
      filter: true,
    },
    { field: 'health', sortable: true, filter: true },
    { field: 'status', sortable: true, filter: true },
    { field: 'doc_count', sortable: true, filter: true },
    { field: 'size', sortable: true, filter: true },
  ];
  rowData: any = [];
  stats: any = [];
  private gridApi!: GridApi;
  constructor(private _es: EsManagementService, private _dialog: MatDialog) {}

  ngOnInit(): void {
    this.getAllIndices();
    this.getAllIndicesStats();
  }

  getAllIndicesStats() {
    this._es
      .getAllIndicesStats()
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.stats = res.map((row: any) => {
            return {
              health: row.health,
              status: row.status,
              index: row.index,
              doc_count: row['docs.count'],
              size: row['store.size'],
            };
          });
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  getAllIndices() {
    this._es
      .getAllIndices()
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.rowData = res;
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  onSelectionChanged(event: any) {
    this.selectedRows = this.gridApi.getSelectedRows();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  deleteIndices() {
    let logs: any = [];
    let confirmation = window.confirm(
      'Deleting the indices will also delete the pipelines associated with it ! are you sure?'
    );
    if (confirmation) {
   
      this._es.deleteIndices(this.selectedRows).subscribe({
        next: (res) => {
          window.location.reload();
          // this._dialog.open(IndexDeletionLogsComponent, {
          //   disableClose: true,
          // });
        },
        error: (err) => {
          console.error(err);
        },
      });
    }
  }
}

@Component({
  selector: 'index-del-logs',
  templateUrl: 'index-del-logs.html',
})
export class IndexDeletionLogsComponent implements OnInit, OnDestroy {
  logs: any = [];
  constructor(
    public dialogRef: MatDialogRef<IndexDeletionLogsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _socket: SocketService
  ) {
    // this._socket.setupSocketConnection();
  }

  ngOnInit(): void {
    // this._socket.socket.on('delete_indices', (data: any) => {
    //   console.log(data);
    //   this.logs.push(data);
    // });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  reload() {
    window.location.reload();
  }

  ngOnDestroy(): void {
    this._socket.disconnect();
  }
}
