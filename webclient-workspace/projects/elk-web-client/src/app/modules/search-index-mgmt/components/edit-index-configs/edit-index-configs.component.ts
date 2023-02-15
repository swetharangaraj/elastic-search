import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';
import { schema } from './schema.value';
import { pluck } from 'rxjs/operators';


@Component({
  selector: 'app-edit-index-configs',
  templateUrl: './edit-index-configs.component.html',
  styleUrls: ['./edit-index-configs.component.css']
})
export class EditIndexConfigsComponent implements OnInit {

  filterConfig!:any;
  
  @ViewChild(JsonEditorComponent) 
  editor!: JsonEditorComponent;
options = new JsonEditorOptions(); 

indexConfig:any = {}

  constructor(
    public dialogRef: MatDialogRef<EditIndexConfigsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _es: EsManagementService

  ) { 
    this.options.mode = 'code';
    this.options.modes = ['code', 'text', 'tree', 'view'];
    this.options.schema = schema;
    this.options.statusBar = false;
    this.options.onChange = () => console.log(this.editor.get());
   
   }

  async ngOnInit(): Promise<void> {
    this.indexConfig  = await this.getIndexConfig();
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

  }

  updateFilterConfig = () =>{
    
  }
}
