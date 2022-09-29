import { Component, OnInit, Pipe } from '@angular/core';
import { pluck } from 'rxjs';
import { EsManagementService } from '../../../../../services/es-management.service';
@Component({
  selector: 'index-stats',
  templateUrl: './index-stats.component.html',
  styleUrls: ['./index-stats.component.css'],
})
export class IndexStatsComponent implements OnInit {
  indicesStats: any = [];

  constructor(private _esmgmt: EsManagementService) {}

  ngOnInit(): void {
  }
}
