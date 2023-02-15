import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchIndexMgmtRoutingModule } from './search-index-mgmt-routing.module';
import { SiMgmtHomeComponent } from './pages/si-mgmt-home/si-mgmt-home.component';
import { MatTabsModule } from '@angular/material/tabs';
import { IndexStatsComponent } from './pages/index-stats/index-stats.component';
import { IndexSyncComponent } from './pages/index-sync/index-sync.component';
import { MatStepperModule } from '@angular/material/stepper';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ExecTargetMysqlComponent } from './components/exec-target-mysql/exec-target-mysql.component';
import { ExecTargetMongoComponent } from './components/exec-target-mongo/exec-target-mongo.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatListModule } from '@angular/material/list';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SyncFinalStepComponent } from './components/sync-final-step/sync-final-step.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { AllIndicesComponent, IndexDeletionLogsComponent } from './components/all-indices/all-indices.component';
import { AgGridModule } from 'ag-grid-angular';
import { AllPipelinesComponent } from './components/all-pipelines/all-pipelines.component';
import { RoleMgmtComponent } from './pages/role-mgmt/role-mgmt.component';
import { MysqlCustomQueryComponent } from './components/mysql-custom-query/mysql-custom-query.component';
import {OverlayModule} from '@angular/cdk/overlay';
import { EditIndexConfigsComponent } from './components/edit-index-configs/edit-index-configs.component';
import { NgJsonEditorModule } from 'ang-jsoneditor'; 

@NgModule({
  declarations: [
    SiMgmtHomeComponent,
    IndexStatsComponent,
    IndexSyncComponent,
    ExecTargetMysqlComponent,
    ExecTargetMongoComponent,
    SyncFinalStepComponent,
    AllIndicesComponent,
    IndexDeletionLogsComponent,
    AllPipelinesComponent,
    RoleMgmtComponent,
    MysqlCustomQueryComponent,
    EditIndexConfigsComponent,
  ],
  imports: [
    CommonModule,
    SearchIndexMgmtRoutingModule,
    MatTabsModule,
    MatStepperModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatButtonToggleModule,
    MatButtonModule,
    AgGridModule.withComponents([]),
    MatIconModule,
    MatAutocompleteModule,
    MatListModule,
    DragDropModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatSelectModule,
    OverlayModule,
    NgJsonEditorModule
  ],
})
export class SearchIndexMgmtModule {}
