import { TestBed } from '@angular/core/testing';

import { NavigatorService } from './navigator.service';

describe('NavigatorService', () => {
  let service: NavigatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NavigatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
