import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllIndicesComponent } from './all-indices.component';

describe('AllIndicesComponent', () => {
  let component: AllIndicesComponent;
  let fixture: ComponentFixture<AllIndicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AllIndicesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllIndicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
