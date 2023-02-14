import { Component, OnInit, Inject } from '@angular/core';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { EsManagementService } from 'projects/elk-web-client/src/services/es-management.service';



@Component({
  selector: 'app-edit-index-configs',
  templateUrl: './edit-index-configs.component.html',
  styleUrls: ['./edit-index-configs.component.css']
})
export class EditIndexConfigsComponent implements OnInit {

  filterConfig!:any;
  

  constructor(
    public dialogRef: MatDialogRef<EditIndexConfigsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _es: EsManagementService

  ) { 

    console.log(this.data); 
   }

  async ngOnInit(): Promise<void> {
    this.filterConfig  = await this.getIndexConfig();
  }

  getIndexConfig = () =>{
    return new Promise((resolve, reject) =>{
      this._es.getIndexConfigs(this.data.index_name).subscribe({next:(res:any) =>{
        resolve(res);
      },error:(err) =>{
        console.error(err);
        reject(err);
      }})
    })
  }

}
