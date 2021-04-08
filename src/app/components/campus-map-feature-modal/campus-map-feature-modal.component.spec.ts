import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CampusMapFeatureModalComponent } from './campus-map-feature-modal.component';

describe('CampusMapFeatureModalComponent', () => {
  let component: CampusMapFeatureModalComponent;
  let fixture: ComponentFixture<CampusMapFeatureModalComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CampusMapFeatureModalComponent],
        imports: [IonicModule.forRoot()],
      }).compileComponents();

      fixture = TestBed.createComponent(CampusMapFeatureModalComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
