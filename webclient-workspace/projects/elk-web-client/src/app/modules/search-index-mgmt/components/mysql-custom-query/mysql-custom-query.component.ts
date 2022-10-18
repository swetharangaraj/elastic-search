import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { Observable } from 'rxjs';
import { map, pluck, startWith } from 'rxjs/operators';
import { COMMA, E, ENTER } from '@angular/cdk/keycodes';
import * as _ from 'underscore';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-mysql-custom-query',
  templateUrl: './mysql-custom-query.component.html',
  styleUrls: ['./mysql-custom-query.component.css'],
})
export class MysqlCustomQueryComponent implements OnInit {
  view: string = 'overview';
  generatedMapping!: any;
  primaryKeyFields: any = [];
  generatedPipelines: any = [];
  selectedPipeline: any;
  disableCreateIndex: boolean = false;
  roleGroupCtrl = new FormControl();
  selectedRoleGroups: any = [];
  allRoleGroups: any = [];
  autocompleteField = new FormControl();
  routeUrl = new FormControl();
  indexAlias = new FormControl();
  primaryKeyFieldctrl = new FormControl();
  indexPrefix = new FormControl();

  finalIndexCreationResult: any = [];
  filteredRoleGroups!: Observable<any[]>;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  @ViewChild('roleGrpInput') roleGrpInput!: ElementRef<HTMLInputElement>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _es: EsManagementService,
    private toastr: ToastrService
  ) {
    this.filteredRoleGroups = this.roleGroupCtrl.valueChanges.pipe(
      startWith(null),
      map((role: any | null) => {
        return role ? this._filter(role) : this.allRoleGroups.slice();
      })
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

  remove(index: number): void {
    this.selectedRoleGroups.splice(index, 1);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.selectedRoleGroups.push(event.option.value);
    this.roleGrpInput.nativeElement.value = '';
    this.roleGroupCtrl.setValue(null);
  }

  ngOnInit(): void {
    this.getRoleGroups();
    this._es
      .constructMappings(this.data)
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.generatedMapping = res;
        },
        error: (err) => {
          this.handleError(err);
        },
      });
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
  handleError(err: any) {
    console.log(err);
  }

  generatePipelines() {
    if (this.indexAlias.valid && this.primaryKeyFieldctrl.valid) {
      let inputObj = {
        selectedDbs: _.pluck(this.data, 'db'),
        indexAlias: this.indexAlias.value,
        primaryKeyField: this.primaryKeyFieldctrl.value,
        isCustomQuery: true,
        customQueries: _.pluck(this.data, 'actualQuery'),
        indexPrefix: this.indexPrefix.value,
      };

      this._es
        .generatePipelines(inputObj)
        .pipe(pluck('data'))
        .subscribe({
          next: (res) => {
            this.generatedPipelines = res;
          },
          error: (err) => {
            this.handleError(err);
          },
        });
    }

    this.data.forEach((db: any) => {
      this.finalIndexCreationResult.push({
        index: `${this.indexPrefix.value}_${db.db}`,
        isElasticIndexCreated: false,
        isMongoIndexCreated: false,
        isPipelineCreated: false,
        db: db.db,
      });
    });
  }

  changePipelineView(pipeline: any) {
    this.view = 'pipeline';
    this.selectedPipeline = pipeline;
  }

  startIndexing() {
    this.disableCreateIndex = true;
    this.createIndex();
    this.createPipelines();
  }

  createIndex() {
    this.finalIndexCreationResult.forEach((index: any, i: number) => {
      this._es
        .createIndex(index.index, this.generatedMapping)
        .pipe(pluck('data'))
        .subscribe({
          next: (res: any) => {
            if (res.acknowledged) {
              index.isElasticIndexCreated = true;
              let doc = {
                index_name: index.index,
                ingestion_mode: 'database_sync',
                database_type: 'mysql',
                pipeline_type: 'logstash',
                pipeline_id: `${index.index}-pipe`,
                executed_on: 'tad',
                db_name: index.db,
                app_name: this.indexAlias.value,
                fetch_method: 'custom_sql_query',
                route_url: this.routeUrl.value,
                index_prefix: this.indexPrefix.value,
                accessible_roleGroups: this.selectedRoleGroups,
                generalQuery: this.data[i].generalQuery,
                transformedQuery: this.data[i].actualQuery,
              };
              this._es.createIndexInMongo(doc).subscribe({
                next: (res) => {
                  index.isMongoIndexCreated = true;
                  console.log('index created');
                  this.toastr.success(
                    'Index Created',
                    'Index Created successfully'
                  );
                },
                error: (err) => {
                  this.handleError(err);
                },
              });
            }
          },
          error: (err) => {
            this.handleError(err);
          },
        });
    });
  }

  createPipelines() {
    this.generatedPipelines.forEach((pipeline: any, index: number) => {
      this._es.createPipeline(pipeline).subscribe({
        next: (res) => {
          this.finalIndexCreationResult[index].isPipelineCreated = true;
        },
        error: (err) => {
          this.handleError(err);
        },
      });
    });
  }
}
