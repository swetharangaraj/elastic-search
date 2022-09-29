import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyncFinalStepComponent } from './sync-final-step.component';

describe('SyncFinalStepComponent', () => {
  let component: SyncFinalStepComponent;
  let fixture: ComponentFixture<SyncFinalStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SyncFinalStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncFinalStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
