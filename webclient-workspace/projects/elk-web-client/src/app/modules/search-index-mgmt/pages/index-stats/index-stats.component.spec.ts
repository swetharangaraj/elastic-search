import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexStatsComponent } from './index-stats.component';

describe('IndexStatsComponent', () => {
  let component: IndexStatsComponent;
  let fixture: ComponentFixture<IndexStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndexStatsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
