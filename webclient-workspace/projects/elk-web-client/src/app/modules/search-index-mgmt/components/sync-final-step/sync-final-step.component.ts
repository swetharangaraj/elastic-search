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
  selector: 'app-sync-final-step',
  templateUrl: './sync-final-step.component.html',
  styleUrls: ['./sync-final-step.component.css'],
})
export class SyncFinalStepComponent implements OnInit {
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
    this.data.selectedDbs.forEach((db: string) => {
      this.finalIndexCreationResult.push({
        index: `${this.data.selectedBaseTable}_${db}`,
        isMappingDone: false,
        isPipelineCreated: false,
        db: db,
      });
    });
    this.primaryKeyFields = _.where(this.data.selectedFields, { Key: 'PRI' });
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

  getOptionStatus(type: string) {
    if (type.includes('char') || type.includes('text')) {
      return false;
    } else return true;
  }

  generatePipelines() {
    let selectedDbs = this.data.selectedDbs;
    if (
      this.autocompleteField.valid &&
      this.indexAlias.valid &&
      this.primaryKeyFieldctrl.valid
    ) {
      this._es
        .generatePipelines({
          selectedDbs: selectedDbs,
          suggestionField: this.autocompleteField.value,
          indexAlias: this.indexAlias.value,
          selectedFields: _.pluck(this.data.selectedFields, 'Field'),
          selectedBaseTable: this.data.selectedBaseTable,
          primaryKeyField: this.primaryKeyFieldctrl.value,
        })
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
    this.finalIndexCreationResult.forEach((index: any) => {
      this._es
        .createIndex(index.index, this.generatedMapping)
        .pipe(pluck('data'))
        .subscribe({
          next: (res: any) => {
            if (res.acknowledged) {
              index.isMappingDone = true;
              let doc = {
                index_name: index.index,
                ingestion_mode: 'database_sync',
                database_type: 'mysql',
                pipeline_type: 'logstash',
                pipeline_id: `${index.index}-pipe`,
                executed_on: 'tad',
                table_name: this.data.selectedBaseTable,
                db_name: index.db,
                app_name: this.indexAlias.value,
                fetch_method: 'table_fetch',
                route_url: this.routeUrl.value,
                accessible_roleGroups: this.selectedRoleGroups,
              };
              this._es.createIndexInMongo(doc).subscribe({
                next: (res) => {
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

  handleError(err: any) {
    console.log(err);
  }
}
