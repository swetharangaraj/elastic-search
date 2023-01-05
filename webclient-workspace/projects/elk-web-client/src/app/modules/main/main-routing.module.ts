import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLandingPageComponent } from './pages/main-landing-page/main-landing-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'searchManagement',
  },
  {
    path: 'searchManagement',
    loadChildren: () =>
      import('../search-index-mgmt/search-index-mgmt.module').then(
        (m) => m.SearchIndexMgmtModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainRoutingModule {}
