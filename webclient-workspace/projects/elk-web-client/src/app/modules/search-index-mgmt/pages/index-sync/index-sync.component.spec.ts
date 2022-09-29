import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexSyncComponent } from './index-sync.component';

describe('IndexSyncComponent', () => {
  let component: IndexSyncComponent;
  let fixture: ComponentFixture<IndexSyncComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndexSyncComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexSyncComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
