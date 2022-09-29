import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecTargetMysqlComponent } from './exec-target-mysql.component';

describe('ExecTargetMysqlComponent', () => {
  let component: ExecTargetMysqlComponent;
  let fixture: ComponentFixture<ExecTargetMysqlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExecTargetMysqlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecTargetMysqlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
