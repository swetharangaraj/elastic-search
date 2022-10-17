import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { Observable } from 'rxjs';
import { map, pluck, startWith } from 'rxjs/operators';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import * as _ from 'underscore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { SyncFinalStepComponent } from '../sync-final-step/sync-final-step.component';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
@Component({
  selector: 'exec-target-mysql',
  templateUrl: './exec-target-mysql.component.html',
  styleUrls: ['./exec-target-mysql.component.css'],
})
export class ExecTargetMysqlComponent implements OnInit {
  selectedTargetDatabaseType!: string;
  tableNameControl = new FormControl();
  baseDbTableNames: string[] = [];
  tableNameFilteredOptions!: Observable<string[]>;
  fullTableFetchApplicableDatabases: any[] = [];
  isFetchingAllowedDbs: boolean = false;
  baseDb: string = 'null';
  baseTableColumns: any = [];
  baseTableColumnsToBeIndexed: any = [];
  isTadSelectionListVisible: boolean = false;
  selectedTadDbs: any = [];
  selectedBaseTable!: string;
  tadSyncPermissionData: any = [];

  /***
   * custom query
   */
  isCustomQuery: boolean = false;
  selectStatement!: string;
  fromTable!: string;
  joinStatement!: string;
  optionalWhere!: string;
  mandatoryWhere: string = `(UNIX_TIMESTAMP(changed_on) > :sql_last_value AND changed_on < NOW() AND is_active = 1) order by changed_on ASC`;
  testableQuery!: string;
  finalQuery!: string;
  testableDatabases: any = [];
  queryTestResults: any = [];

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  constructor(
    private _es: EsManagementService,
    private _snack: MatSnackBar,
    public dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.tableNameFilteredOptions = this.tableNameControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._tableNameFilter(value))
    );
  }

  selectTargetDbType(type: string) {
    this.selectedTargetDatabaseType = type;
    if (this.selectedTargetDatabaseType == 'tad') {
      this._es
        .getBaseDbTables(this.baseDb)
        .pipe(pluck('data'))
        .subscribe({
          next: this.addDataToBaseTables.bind(this),
          error: this.handleError.bind(this),
        });
    } else if (this.selectedTargetDatabaseType == 'other') {
      this.detectOtherDatabaseValueChanges();
      this._es
        .listOtherMysqlDatabases()
        .pipe(pluck('data'))
        .subscribe({
          next: (res) => {
            this.otherDatabaseList = res;
          },
          error: (err) => {
            this.handleError(err);
          },
        });
    }
  }

  addDataToBaseTables(tables: any) {
    this.baseDbTableNames = tables;
  }

  private _tableNameFilter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.baseDbTableNames.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  changeInBaseTable(event: MatAutocompleteSelectedEvent) {
    this.isFetchingAllowedDbs = true;
    let table = event.option.value;
    this.selectedBaseTable = table;
    this.baseTableColumnsToBeIndexed = [];
    this._es
      .descBaseTable(this.baseDb, table)
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.baseTableColumns = res;
          this.baseTableColumns.forEach((element: any, index: number) => {
            if (element.Key === 'PRI') {
              this.baseTableColumnsToBeIndexed.push(element);
              this.baseTableColumns.splice(index, 1);
            }
            if (
              element.Field === 'changed_on' &&
              element.Type == 'timestamp' &&
              element.Null == 'NO' &&
              element.Default == 'CURRENT_TIMESTAMP'
            ) {
              this.baseTableColumnsToBeIndexed.push(element);
              this.baseTableColumns.splice(index, 1);
            }
          });
        },
        error: (err) => {
          this.handleError(err);
        },
      });

    this.getTableFetchModeDbs(this.baseDb, table);
  }

  getTableFetchModeDbs(baseDb: string, table: string) {
    this._es
      .getTableFetchModeDbs(baseDb, table)
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.fullTableFetchApplicableDatabases = res;
          this.isFetchingAllowedDbs = false;
        },
        error: (err) => {
          this.isFetchingAllowedDbs = false;
          this.handleError(err);
        },
      });
  }

  switchToTadSelectionView() {
    if (this.baseTableColumnsToBeIndexed.length >= 3) {
      let isChangedOnFieldPresentInSelectedCol = _.where(
        this.baseTableColumnsToBeIndexed,
        {
          Field: 'changed_on',
          Type: 'timestamp',
          Null: 'NO',
          Default: 'CURRENT_TIMESTAMP',
        }
      );

      let selectedColHasPk = _.where(this.baseTableColumnsToBeIndexed, {
        Key: 'PRI',
      });
      if (
        isChangedOnFieldPresentInSelectedCol.length > 0 &&
        selectedColHasPk.length > 0
      ) {
        this.isTadSelectionListVisible = true;
        this._snack.open('Columns saved successfully!', 'close');
      } else {
        this._snack.open(
          'Check whether the selected columns contain a PRIMARY KEY and has CHANGED_ON column',
          'close'
        );
      }
    } else {
      this._snack.open(
        'Check whether the selected columns contain at least 3 fields!',
        'close'
      );
    }
  }

  drop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  handleError(err: any) {
    console.log(err);
  }

  databaseSelectionChange(event: any) {
    this.selectedTadDbs = event.option.selectionList._value;
  }

  verify() {
    console.log(JSON.stringify(this.selectedTadDbs));
    console.log(JSON.stringify(this.baseTableColumnsToBeIndexed));
    this._es
      .checkTadColumnEquivality(
        this.selectedBaseTable,
        this.selectedTadDbs,
        this.baseTableColumnsToBeIndexed
      )
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          console.log(res);
          this.tadSyncPermissionData = res;
        },
        error: this.handleError,
      });
  }

  proceedToFinalStep() {
    let restrictionCounter = 0;
    this.tadSyncPermissionData.forEach((db: any) => {
      if (db.restricSync) restrictionCounter++;
    });
    if (restrictionCounter > 0) {
      this._snack.open(
        'Some Tenant Databases cant be indexed kindly resolve conflicts',
        'dismiss'
      );
    } else {
      let finalStepData = {
        selectedDbs: _.pluck(this.tadSyncPermissionData, 'database'),
        selectedDbType: this.selectedTargetDatabaseType,
        selectedFields: this.baseTableColumnsToBeIndexed,
        selectedBaseTable: this.selectedBaseTable,
      };

      const dialogRef = this.dialog.open(SyncFinalStepComponent, {
        disableClose: true,
        data: finalStepData,
        maxWidth: '100vw',
        maxHeight: '100vh',
        width: '80%',
        height: '90%',
      });

      dialogRef.afterClosed().subscribe((result) => {
        console.log(`Dialog result: ${result}`);
      });
    }
  }

  //____________________________TAD DATABASE MODEL ENDS _________________________
  //_____________________________________________________________________________

  otherDatabaseList: any = [];
  otherDataBaseFormCtrl = new FormControl();
  selectedOtherDbTableList: any = [];
  selectedOtherDbTableCtrl = new FormControl();
  selectedOtherTableColumns: any = [];
  otherTableColumns: any = [];

  detectOtherDatabaseValueChanges() {
    this.detectSelectedOtherDbTableCtrlChange();
    this.otherDataBaseFormCtrl.valueChanges.subscribe({
      next: (val) => {
        this._es
          .getBaseDbTables(val)
          .pipe(pluck('data'))
          .subscribe({
            next: (res) => {
              this.selectedOtherDbTableList = res;
            },
            error: (err) => this.handleError(err),
          });
      },
      error: (err) => this.handleError(err),
    });
  }

  detectSelectedOtherDbTableCtrlChange() {
    this.selectedOtherDbTableCtrl.valueChanges.subscribe({
      next: (res) => {
        this._es
          .descBaseTable(
            this.otherDataBaseFormCtrl.value,
            this.selectedOtherDbTableCtrl.value
          )
          .pipe(pluck('data'))
          .subscribe({
            next: (res) => {
              this.selectedOtherTableColumns = [];
              this.otherTableColumns = res;
              this.otherTableColumns.forEach((col: any, index: number) => {
                if (col.Key === 'PRI' || col.Field == 'changed_on') {
                  this.selectedOtherTableColumns.push(col);
                  this.otherTableColumns.splice(index, 1);
                }
              });
            },
            error: (err) => this.handleError(err),
          });
      },
      error: (err) => this.handleError(err),
    });
  }

  proceedToMappingOtherTab() {
    let changed_on_field = _.where(this.selectedOtherTableColumns, {
      Field: 'changed_on',
    });
    let primary_key_field = _.where(this.selectedOtherTableColumns, {
      Key: 'PRI',
    });
    if (
      this.selectedOtherDbTableCtrl.valid &&
      this.otherDataBaseFormCtrl.valid &&
      changed_on_field.length > 0 &&
      primary_key_field.length > 0 &&
      this.selectedOtherTableColumns.length >= 3
    ) {
      let finalStepData = {
        selectedDbs: [this.otherDataBaseFormCtrl.value],
        selectedDbType: this.selectedTargetDatabaseType,
        selectedFields: this.selectedOtherTableColumns,
        selectedBaseTable: this.selectedOtherDbTableCtrl.value,
      };

      const dialogRef = this.dialog.open(SyncFinalStepComponent, {
        disableClose: true,
        data: finalStepData,
        maxWidth: '100vw',
        maxHeight: '100vh',
        width: '80%',
        height: '90%',
      });

      dialogRef.afterClosed().subscribe((result) => {
        console.log(`Dialog result: ${result}`);
      });
    } else {
      this.toastr.error(
        'check fields!',
        'ensure PRI, changed_on and minimum 3 fields are present'
      );
    }
  }

  /***custom query methods */
  generateQuery = () => {
    if (this.selectStatement && this.fromTable) {
      this.testableQuery = `${this.selectStatement.replace(
        '\n',
        ' '
      )} AS unix_ts_in_secs FROM ${this.fromTable} ${
        this.joinStatement ? this.joinStatement.replace('\n', ' ') : ''
      } ${this.optionalWhere ? 'WHERE ' + this.optionalWhere : ''} LIMIT 1`;

      this.finalQuery = `${this.selectStatement.replace(
        '\n',
        ' '
      )} AS unix_ts_in_secs FROM ${this.fromTable} ${
        this.joinStatement ? this.joinStatement.replace('\n', ' ') : ''
      } WHERE ${this.optionalWhere ? this.optionalWhere + ' AND' : ''}  ${
        this.mandatoryWhere
      }`;
    }

    this.testableQuery = this.testableQuery.replaceAll('\n', ' ');
    this.finalQuery = this.finalQuery.replaceAll('\n', ' ');
  };

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.testableDatabases.push(value);
    }
    event.chipInput!.clear();
  }
  remove(field: string): void {
    const index = this.testableDatabases.indexOf(field);

    if (index >= 0) {
      this.testableDatabases.splice(index, 1);
    }
  }

  testQuery() {
    this.testableDatabases.forEach((db: string) => {
      let testQueryString = this.testableQuery.replaceAll('db_name', db);
      let finalQueryString = this.finalQuery.replaceAll('db_name', db);
      console.log(this.testableQuery);
      this._es.testQuery(testQueryString).subscribe({
        next: (res) => {
          this.queryTestResults.push({
            db: db,
            testQuery: testQueryString,
            actualQuery: finalQueryString,
            testResult: 'success',
          });
        },
        error: (err) => {
          this.queryTestResults.push({
            db: db,
            testQuery: testQueryString,
            actualQuery: finalQueryString,
            testResult: 'failed',
            err: err,
          });
        },
      });
    });
  }
}
