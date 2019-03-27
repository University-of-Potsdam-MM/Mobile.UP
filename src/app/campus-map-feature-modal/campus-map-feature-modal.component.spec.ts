import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CampusMapFeatureModalComponent } from './campus-map-feature-modal.component';

describe('CampusMapFeatureModalComponent', () => {
  let component: CampusMapFeatureModalComponent;
  let fixture: ComponentFixture<CampusMapFeatureModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CampusMapFeatureModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CampusMapFeatureModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
