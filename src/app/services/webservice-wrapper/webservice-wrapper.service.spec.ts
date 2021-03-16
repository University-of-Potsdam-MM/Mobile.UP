import { TestBed } from '@angular/core/testing';

import { WebserviceWrapperService } from './webservice-wrapper.service';

describe('WebserviceWrapperService', () => {
  let service: WebserviceWrapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebserviceWrapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
