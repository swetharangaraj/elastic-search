import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecTargetMongoComponent } from './exec-target-mongo.component';

describe('ExecTargetMongoComponent', () => {
  let component: ExecTargetMongoComponent;
  let fixture: ComponentFixture<ExecTargetMongoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecTargetMongoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecTargetMongoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
