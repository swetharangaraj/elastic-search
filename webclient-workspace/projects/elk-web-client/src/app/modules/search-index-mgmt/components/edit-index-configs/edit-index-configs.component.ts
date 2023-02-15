import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { pluck } from 'rxjs/operators';


@Component({
  selector: 'app-edit-index-configs',
  templateUrl: './edit-index-configs.component.html',
  styleUrls: ['./edit-index-configs.component.css']
})
export class EditIndexConfigsComponent implements OnInit {

  filterConfig!:any;
  indexUiMapping!:any;



indexConfig:any = {}

  constructor(
    public dialogRef: MatDialogRef<EditIndexConfigsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _es: EsManagementService

  ) {    
   }

  async ngOnInit(): Promise<void> {
    this.indexConfig  = await this.getIndexConfig();
    this.indexUiMapping = JSON.stringify(this.indexConfig.index_ui_mapping?.fields, null, 2);
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
}
