import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexStatsComponent } from './pages/index-stats/index-stats.component';
import { IndexSyncComponent } from './pages/index-sync/index-sync.component';
import { RoleMgmtComponent } from './pages/role-mgmt/role-mgmt.component';
import { SiMgmtHomeComponent } from './pages/si-mgmt-home/si-mgmt-home.component';

const routes: Routes = [
  {
    path: '',
    component: SiMgmtHomeComponent,
    children: [
      {
        path: '',
        redirectTo: 'stats',
        pathMatch: 'full',
      },
      {
        path: 'stats',
        component: IndexStatsComponent,
      },
      {
        path: 'sync',
        component: IndexSyncComponent,
      },
      {
        path: 'role-mgmt',
        component: RoleMgmtComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SearchIndexMgmtRoutingModule {}
