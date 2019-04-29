import { TestBed } from '@angular/core/testing';

import { WebserviceWrapperService } from './webservice-wrapper.service';

describe('WebserviceWrapperService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebserviceWrapperService = TestBed.get(WebserviceWrapperService);
    expect(service).toBeTruthy();
  });
});
