import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { Observable } from 'rxjs/internal/Observable';
import { map, pluck, startWith } from 'rxjs/operators';


@Component({
  selector: 'app-edit-index-configs',
  templateUrl: './edit-index-configs.component.html',
  styleUrls: ['./edit-index-configs.component.css']
})
export class EditIndexConfigsComponent implements OnInit {

  filterConfig!:any;
  indexUiMapping!:any;

  roleGroupCtrl = new FormControl();
  selectedRoleGroups: any = [];
  allRoleGroups: any = [];
  filteredRoleGroups!: Observable<any[]>;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  @ViewChild('roleGrpInput') roleGrpInput!: ElementRef<HTMLInputElement>;


indexConfig:any = {}

  constructor(
    public dialogRef: MatDialogRef<EditIndexConfigsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _es: EsManagementService

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

  async ngOnInit(): Promise<void> {
    this.indexConfig  = await this.getIndexConfig();
    this.indexUiMapping = JSON.stringify(this.indexConfig.index_ui_mapping?.fields, null, 2);
    this.getRoleGroups();
    this.selectedRoleGroups = this.data.accessible_roleGroups
  }

  
  getRoleGroups = () => {
    this._es
      .getRoleGroups()
      .pipe(pluck('data'))
      .subscribe({
        next: (res) => {
          this.allRoleGroups = res;
        },
        error: (err) => console.error(err)
      });
  };

  remove(index: number): void {
    this.selectedRoleGroups.splice(index, 1);
  }
  
  selected(event: MatAutocompleteSelectedEvent): void {
    this.selectedRoleGroups.push(event.option.value);
    this.roleGrpInput.nativeElement.value = '';
    this.roleGroupCtrl.setValue(null);
  }

  

  getIndexConfig = () =>{
    return new Promise((resolve, reject) =>{
      this._es.getIndexConfigs(this.data.index_name).pipe(pluck('data')).subscribe({next:(res:any) =>{
        resolve(res);
      },error:(err:any) =>{
        console.error(err);
        reject(err);
      }})
    })
  }

  updateUiMapping = () =>{
    console.log(JSON.parse(this.indexUiMapping))

    this._es.updateUiMap(this.indexConfig.index_ui_mapping._id, this.data.index_name, JSON.parse(this.indexUiMapping)).subscribe({
      next:(res:any) =>{
        console.log(res);
        window.location.reload();
      },
      error:(err:any) =>{
        console.error(err);
      }
    })
  }

  updateFilterConfig = () =>{
   
  }

  updateRoleGroups = () =>{
    this._es.updateIndexRole(this.selectedRoleGroups,this.data._id).subscribe({
      next:(res:any) =>{window.location.reload()},
      error:(err:any) =>{console.error(err)}
    })
  }
}
