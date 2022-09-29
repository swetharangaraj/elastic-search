import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLandingPageComponent } from './pages/main-landing-page/main-landing-page.component';

const routes: Routes = [
  {
    path: '',
    component: MainLandingPageComponent,
    children: [
      {
        path:'',
        redirectTo:'dashboard',
        pathMatch:'full'
      },
      {
        path:'dashboard',
        loadChildren: () => import("../dashboard/dashboard.module").then(m =>m.DashboardModule)
      },
      {
        path:'searchManagement',
        loadChildren: () => import("../search-index-mgmt/search-index-mgmt.module").then(m => m.SearchIndexMgmtModule)
      },
      {
        path:'searchIndexCreation',
        loadChildren:() => import("../search-index-creation/search-index-creation.module").then(m => m.SearchIndexCreationModule)
      }
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
