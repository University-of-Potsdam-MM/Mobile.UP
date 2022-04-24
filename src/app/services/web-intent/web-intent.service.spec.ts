import { TestBed } from '@angular/core/testing';
import { WebIntentService } from './web-intent.service';

describe('WebIntentService', () => {
  let service: WebIntentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebIntentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
