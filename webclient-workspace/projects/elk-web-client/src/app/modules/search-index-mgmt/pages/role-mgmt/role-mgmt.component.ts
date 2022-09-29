import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { map, pluck, startWith } from 'rxjs/operators';
import * as _ from 'underscore';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { COMMA, E, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-role-mgmt',
  templateUrl: './role-mgmt.component.html',
  styleUrls: ['./role-mgmt.component.css'],
})
export class RoleMgmtComponent implements OnInit {
  indices: any = [];
  public rowSelection = 'multiple';
  selectedRows: any = [];
  columnDefs: ColDef[] = [
    {
      field: 'index_name',
      sortable: true,
      filter: true,
      checkboxSelection: true,
    },
    { field: 'formatted_acc_roles', sortable: true, filter: true },
    { field: 'database_type', sortable: true, filter: true },

    { field: 'db_name', sortable: true, filter: true },

    { field: 'table_name', sortable: true, filter: true },
  ];
  private gridApi!: GridApi;
  roleGroupCtrl = new FormControl();
  filteredRoleGroups!: Observable<any[]>;
  allRoleGroups: any = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  selectedRoleGroups: any = [];
  @ViewChild('roleGrpInput') roleGrpInput!: ElementRef<HTMLInputElement>;

  constructor(private _es: EsManagementService, private toastr: ToastrService) {
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

  ngOnInit(): void {
    this.getRoleGroups();
    this.getAllIndices();
  }
  onSelectionChanged(event: any) {
    this.selectedRows = this.gridApi.getSelectedRows();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  getAllIndices() {
    this._es
      .getAllIndices()
      .pipe(pluck('data'))
      .subscribe({
        next: (res: any) => {
          this.indices = res.map((row: any) => {
            return {
              _id: row._id,
              index_name: row.index_name,
              accessible_roles: row.accessible_roleGroups,
              formatted_acc_roles: _.pluck(
                row.accessible_roleGroups,
                'role_name'
              ).toString(),
              database_type: row.database_type,
              db_name: row.db_name,
              table_name: row.table_name,
            };
          });
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  updateRoles() {
    let indices = _.pluck(this.selectedRows, 'index_name');

    this._es.updateIndicesRoles(indices, this.selectedRoleGroups).subscribe({
      next: (res) => {
        window.location.reload();
      },
      error: (err) => this.handleError(err),
    });
  }
  remove(index: number): void {
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
  handleError(err: any) {
    console.log(err);
  }
}
