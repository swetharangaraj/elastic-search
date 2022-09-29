import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { Observable } from 'rxjs';
import { map, pluck, startWith } from 'rxjs/operators';

import * as _ from 'underscore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'exec-target-mongo',
  templateUrl: './exec-target-mongo.component.html',
  styleUrls: ['./exec-target-mongo.component.css'],
})
export class ExecTargetMongoComponent implements OnInit {
  selectedTargetDatabaseType!: string;
  tenantDatabases: any = [];
  otherDatabases: any = [];
  collectionNameControl = new FormControl();
  selectedBaseCollection!: string;
  collectionNameFilteredOptions!: Observable<string[]>;
  baseCollectionNames: any = [];
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  fieldsToBeIndexed: any = ['_id'];
  collectionExistenceResult: any = [];
  indexToBeCreated: any = [];
  indexAlias = new FormControl();
  constructedMapping!: any;

  roleGroupCtrl = new FormControl();
  selectedRoleGroups: any = [];
  allRoleGroups: any = [];
  @ViewChild('roleGrpInput') roleGrpInput!: ElementRef<HTMLInputElement>;
  filteredRoleGroups!: Observable<any[]>;
  routeUrl = new FormControl();

  /**Other database migration mode declarations */
  otherDbNameFormCtrl = new FormControl();
  otherDbFilteredOptions!: Observable<string[]>;
  selectedOtherDb!: string;

  otherSelectedDbCollections: any = [];
  otherDbCollectionNameFormCtrl = new FormControl();
  otherDbCollectionFilteredOptions!: Observable<string[]>;
  selectedOtherDbCollection!: string;

  constructor(
    private _es: EsManagementService,
    public dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.getRoleGroups();
    this.getAllDatabases();
    this.getBaseCollections();
    this.collectionNameFilteredOptions =
      this.collectionNameControl.valueChanges.pipe(
        startWith(''),
        map((value) => this._tableNameFilter(value))
      );
    this.filteredRoleGroups = this.roleGroupCtrl.valueChanges.pipe(
      startWith(null),
      map((role: any | null) => {
        return role ? this._filter(role) : this.allRoleGroups.slice();
      })
    );
    this.otherDbFilteredOptions = this.otherDbNameFormCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this._otherDbNameFilter(value))
    );

    this.getMapping();
  }

  private _otherDbNameFilter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.otherDatabases.filter((option: string) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  private _otherDbCollectionNameFilter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.otherSelectedDbCollections.filter((option: string) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  private _filter(value: any): any[] {
    let filterValue: any = null;
    if (typeof value == 'object') {
      filterValue = value.role_name.toLowerCase();
    } else filterValue = value.toLowerCase();

    return this.allRoleGroups.filter((role: any) =>
      role.role_name.toLowerCase().includes(filterValue)
    );
  }

  removeRole(index: number): void {
    this.selectedRoleGroups.splice(index, 1);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.selectedRoleGroups.push(event.option.value);
    this.roleGrpInput.nativeElement.value = '';
    this.roleGroupCtrl.setValue(null);
  }

  getRoleGroups = () => {
    this._es
      .getRoleGroups()
      .pipe(pluck('data'))
      .subscribe({
        next: (res) => {
          this.allRoleGroups = res;
        },
        error: (err) => this.handleError(err),
      });
  };

  getMapping() {
    this._es
      .getMappings({
        is_default: true,
      })
      .pipe(pluck('data'))
      .subscribe({
        next: (res) => {
          this.constructedMapping = res;
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.fieldsToBeIndexed.push(value);
    }
    event.chipInput!.clear();
  }

  remove(field: string): void {
    const index = this.fieldsToBeIndexed.indexOf(field);

    if (index >= 0) {
      this.fieldsToBeIndexed.splice(index, 1);
    }
  }

  private _tableNameFilter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.baseCollectionNames.filter((option: string) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  getBaseCollections = () => {
    this._es
      .getMongoBaseCollections()
      .pipe(pluck('data'))
      .subscribe({
        next: (res) => {
          this.baseCollectionNames = res;
        },
        error: (err) => this.handleError(err),
      });
  };

  getAllDatabases = () => {
    this._es
      .getMongoAllDatabases()
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.tenantDatabases = res.tenant_dbs;
          this.otherDatabases = res.other_dbs;
        },
        error: (err) => this.handleError(err),
      });
  };

  selectTargetDbType(type: string) {
    this.selectedTargetDatabaseType = type;
  }

  changeInBaseCollection(event: MatAutocompleteSelectedEvent) {
    let collection = event.option.value;
    this.selectedBaseCollection = collection;
    this._es
      .getcollectionExistenceResult(
        this.tenantDatabases,
        this.selectedBaseCollection
      )
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.collectionExistenceResult = res.map((element: any) => {
            return {
              ...element,
              isSelected: false,
            };
          });
        },
        error: (err) => this.handleError(err),
      });
  }

  changeInOtherDatabase(event: MatAutocompleteSelectedEvent) {
    this.selectedOtherDb = event.option.value;
    this._es
      .listCollectionsOfDatabase(this.selectedOtherDb)
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.otherSelectedDbCollections = res;
          this.otherDbCollectionFilteredOptions =
            this.otherDbCollectionNameFormCtrl.valueChanges.pipe(
              startWith(''),
              map((value) => this._otherDbCollectionNameFilter(value))
            );
        },
        error: (err) => this.handleError(err),
      });
  }

  changeInOtherDatabaseCollection(event: MatAutocompleteSelectedEvent) {
    this.selectedOtherDbCollection = event.option.value;
  }

  formIndexToBeCreated() {
    this.indexToBeCreated = [];
    this.collectionExistenceResult.forEach((element: any) => {
      if (element.isSelected)
        this.indexToBeCreated.push({
          ...element,
          index_name: `${element.col}_${element.db}`,
        });
    });
  }

  startIndexing() {
    if (
      this.indexToBeCreated.length > 0 &&
      this.fieldsToBeIndexed.length >= 3 &&
      this.indexAlias.valid
    ) {
      this.createElasticIndices();
      this.createMongoPipelines();
    } else {
      this.toastr.error(
        'You dont match the criteria \n should have 3 or more fields, \n A database must be selected, \n index alias name should be provided'
      );
    }
  }

  startIndexingOtherDbCollection() {
    if (this.selectedOtherDbCollection) {
      this._es
        .createIndex(this.selectedOtherDbCollection, this.constructedMapping)
        .pipe(pluck('data'))
        .subscribe({
          next: (res: any) => {
            if (res.acknowledged) {
              this.toastr.info(
                `Created index ${this.selectedOtherDbCollection}`
              );

              /**some condition to be put later */
              let condition = true;
              if (condition) {
                let collectionToBeIndexed = {
                  index_name: this.selectedOtherDbCollection,
                  db: this.selectedOtherDb,
                  alias: this.indexAlias.value,
                  col: this.selectedOtherDbCollection,
                };
                this._es
                  .createMongoPipelines(
                    collectionToBeIndexed,
                    this.fieldsToBeIndexed,
                    this.selectedRoleGroups,
                    this.routeUrl.value,
                    'other_db'
                  )
                  .subscribe({
                    next: (res) => {
                      console.log(res);
                      this.toastr.success(
                        `created pipeline ${this.selectedOtherDbCollection}-pipe`
                      );
                    },
                    error: (err) => this.handleError(err),
                  });
              }
            }
          },
          error: (err) => this.handleError(err),
        });
    }
  }

  createElasticIndices() {
    this.indexToBeCreated.forEach((index: any) => {
      this._es
        .createIndex(index.index_name, this.constructedMapping)
        .pipe(pluck('data'))
        .subscribe({
          next: (res: any) => {
            if (res.acknowledged) {
              this.toastr.info(`Created index ${index.index_name}`);
              index.isIndexed = true;
            }
          },
          error: (err) => this.handleError(err),
        });
    });
  }

  createMongoPipelines() {
    if (this.indexAlias.valid && this.indexToBeCreated.length > 0) {
      this.indexToBeCreated.forEach((col: any) => {
        let data = { ...col, alias: this.indexAlias.value };
        this._es
          .createMongoPipelines(
            data,
            this.fieldsToBeIndexed,
            this.selectedRoleGroups,
            this.routeUrl.value,
            'tad'
          )
          .subscribe({
            next: (res) => {
              console.log(res);
              this.toastr.success(`created pipeline ${col.index_name}-pipe`);
              col.isPipelined = true;
            },
            error: (err) => this.handleError(err),
          });
      });
    }
  }

  handleError(err: any) {
    console.log(err);
  }
}
