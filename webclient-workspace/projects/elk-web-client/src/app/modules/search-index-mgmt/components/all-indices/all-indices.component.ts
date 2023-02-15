import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { SocketService } from 'projects/elk-web-client/src/services/socket.service';
import { pluck } from 'rxjs/operators';
import * as _ from "underscore";
import { EditIndexConfigsComponent } from '../edit-index-configs/edit-index-configs.component';
@Component({
  selector: 'app-all-indices',
  templateUrl: './all-indices.component.html',
  styleUrls: ['./all-indices.component.css'],
})
export class AllIndicesComponent implements OnInit {
  public rowSelection = 'multiple';
  availableTenants: any = [];
  columnDefs: ColDef[] = [
    {
      field: 'index_name',
      sortable: true,
      filter: true,
      checkboxSelection: true,
    },
    { field: 'database_type', sortable: true, filter: true },
    { field: 'db_name', sortable: true, filter: true },
    { field: 'index_prefix', sortable: true, filter: true },
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
  isAllTenantsOpen: boolean = false;
  selectedTenants = new FormControl();

  constructor(private _es: EsManagementService, private _dialog: MatDialog) { }

  ngOnInit(): void {
    this.getAllIndices();
    this.getAllIndicesStats();
    this.getAllTenants();
  }


  getAllTenants = () => {
    this._es.getActiveTenants().pipe(pluck('data')).subscribe({
      next: (res: any) => {
        this.availableTenants = res;
      }, error: (err) => { console.error(err); }
    })
  }


  startSyncingPipelines = () => {

    if (this.selectedTenants.value.length > 0 && this.selectedRows.length > 0) {

      this.selectedRows.forEach((value: any, index: any, array: any) => {

        this.selectedTenants.value.forEach((tenant: any, tenantIndex: any, tenantArray: any) => {


          let selectedDb = tenant.tad;
          let indexAlias = value.app_name;
          let primaryKeyField = value.primary_key_field;
          let query = value.generalQuery.replaceAll('db_name', selectedDb);
          let indexPrefix = value.index_prefix;
          let inputObj = {
            selectedDbs: [selectedDb],
            indexAlias: indexAlias,
            primaryKeyField: primaryKeyField,
            isCustomQuery: true,
            customQueries: [query],
            indexPrefix: indexPrefix,
          };
          this._es
            .generatePipelines(inputObj)
            .pipe(pluck('data'))
            .subscribe({
              next: (res: any) => {

                let pipeline = res[0];

                /*** index creation */
                let index = `${indexPrefix}_${selectedDb}`;
                this._es.createIndex(index, []).pipe(pluck('data')).subscribe(
                  {
                    next: (res: any) => {
                      console.log("created elastic Index", index)

                      let doc = {
                        index_name: index,
                        ingestion_mode: 'database_sync',
                        database_type: 'mysql',
                        pipeline_type: 'logstash',
                        pipeline_id: `${index}-pipe`,
                        executed_on: 'tad',
                        db_name: selectedDb,
                        app_name: indexAlias,
                        primary_key_field: primaryKeyField,
                        fetch_method: 'custom_sql_query',
                        route_url: value.route_url,
                        auth_filter_api: value.auth_filter_api,
                        index_prefix: indexPrefix,
                        accessible_roleGroups: value.accessible_roleGroups,
                        generalQuery: value.generalQuery,
                        transformedQuery: query,
                      }
                      // console.log(pipeline);
                      // console.log(doc);

                      this._es.createIndexInMongo(doc).subscribe({
                        next: (res) => {
                          console.log("created mongo index", index);

                          this._es.createPipeline(pipeline).subscribe({
                            next: (res: any) => {
                              console.log("logstash pipline created", `${index}-pipe`)


                              this._es.syncIndexUiMap(value.index_name, index).subscribe({
                                next: (res: any) => {
                                  console.log("Ui mapping created for index", index)
                                  console.log("------------------------------------")
                                }, error: (err) => {
                                  console.error(err);
                                }
                              })

                              



                            }, error: (err) => {
                              console.error(err);
                            }
                          })


                        },
                        error: (err) => {
                          console.error(err);
                        },
                      });

                    },
                    error: (err) => {
                      console.error(err);
                    }
                  }
                )

                /***index creation ends */

              },
              error: (err) => {
                console.error(err);
              },
            });


        })




      })



      // this._es.SyncBasePipelineWithTenants(this.selectedRows, this.selectedTenants).subscribe({next:(res:any) =>{
      //   console.log(res);
      // },error:(err) =>{
      //   console.error(err);
      // }})
    }
  }

  getGeneratedPipeLines() {

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
    if(this.selectedRows.length == 1)
    this.openEditUiMapAndFilterConfigDialog();
  }


  openEditUiMapAndFilterConfigDialog(){
    const dialogRef = this._dialog.open(EditIndexConfigsComponent, {
      data: this.selectedRows[0],
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  syncForOtherTenants() {
    console.log(this.selectedRows)
    this.isAllTenantsOpen = true;
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
