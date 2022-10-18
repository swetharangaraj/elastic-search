import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MysqlCustomQueryComponent } from './mysql-custom-query.component';

describe('MysqlCustomQueryComponent', () => {
  let component: MysqlCustomQueryComponent;
  let fixture: ComponentFixture<MysqlCustomQueryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MysqlCustomQueryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MysqlCustomQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
