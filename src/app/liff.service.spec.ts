import { TestBed } from '@angular/core/testing';

import { LiffService } from './liff.service';

describe('LiffService', () => {
  let service: LiffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiffService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
