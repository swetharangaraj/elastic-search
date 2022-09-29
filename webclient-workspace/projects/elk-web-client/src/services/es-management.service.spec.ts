import { TestBed } from '@angular/core/testing';

import { EsManagementService } from './es-management.service';

describe('EsManagementService', () => {
  let service: EsManagementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EsManagementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
