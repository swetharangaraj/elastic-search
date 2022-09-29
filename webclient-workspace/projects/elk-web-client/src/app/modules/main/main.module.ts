import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainRoutingModule } from './main-routing.module';
import { MainLandingPageComponent } from './pages/main-landing-page/main-landing-page.component';


@NgModule({
  declarations: [
    MainLandingPageComponent
  ],
  imports: [
    CommonModule,
    MainRoutingModule
  ]
})
export class MainModule { }
