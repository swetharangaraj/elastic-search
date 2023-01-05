import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'main-landing-page',
  templateUrl: './main-landing-page.component.html',
  styleUrls: ['./main-landing-page.component.css']
})
export class MainLandingPageComponent implements OnInit {

  routes:any = [
    // {
    //   path:'dashboard',
    //   value:'dashboard'
    // },
    {
      path:'searchManagement',
      value:'Search index Management'
    },
    // {
    //   path:'searchIndexCreation',
    //   value:'Search Index creation'
    // }
  ]

  constructor() { }

  ngOnInit(): void {
  }

}
