import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditIndexConfigsComponent } from './edit-index-configs.component';

describe('EditIndexConfigsComponent', () => {
  let component: EditIndexConfigsComponent;
  let fixture: ComponentFixture<EditIndexConfigsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditIndexConfigsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditIndexConfigsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
