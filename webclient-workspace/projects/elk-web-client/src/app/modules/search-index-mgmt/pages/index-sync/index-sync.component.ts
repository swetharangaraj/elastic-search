import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';

@Component({
  selector: 'index-sync',
  templateUrl: './index-sync.component.html',
  styleUrls: ['./index-sync.component.css'],
})
export class IndexSyncComponent implements OnInit {
  selectedDatabaseType!: string;
  selectedIngestionMode!: string;
  selectedFetchMethod!: string;
  firstFormGroup!: FormGroup;
  secondFormGroup!: FormGroup;
  ingestionMode: any = [
    { label: 'Database Sync', value: 'database_sync' },
    { label: 'REST API', value: 'rest' },
  ];
  fetchMethods: any = [
    { label: 'Table / collection FETCH', value: 'tableOrcollection_fetch' },
    // { label: 'Custom query FETCH', value: 'custom_query_fetch' },
  ];

  dbTypes: any = [
    { label: 'MYSQL', value: 'mysql' },
    { label: 'Mongo DB', value: 'mongo' },
  ];

  constructor() {}

  ngOnInit(): void {}

  selectIngestionMode(ingestion_mode: string, stepper: MatStepper) {
    this.selectedIngestionMode = ingestion_mode;
    stepper.next();
  }

  selectdbType(db_type: string, stepper: MatStepper) {
    this.selectedDatabaseType = db_type;
  }

  goBack(stepper: MatStepper) {
    stepper.previous();
  }

  selectFetchMethod(method: string) {
    this.selectedFetchMethod = method;
  }

  moveFromDbTypeStep(stepper: MatStepper) {
    if (this.selectedDatabaseType && this.selectFetchMethod) stepper.next();
  }
}
