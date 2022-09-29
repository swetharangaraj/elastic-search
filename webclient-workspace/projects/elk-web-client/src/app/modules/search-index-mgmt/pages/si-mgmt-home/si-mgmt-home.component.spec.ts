import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiMgmtHomeComponent } from './si-mgmt-home.component';

describe('SiMgmtHomeComponent', () => {
  let component: SiMgmtHomeComponent;
  let fixture: ComponentFixture<SiMgmtHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SiMgmtHomeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SiMgmtHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
