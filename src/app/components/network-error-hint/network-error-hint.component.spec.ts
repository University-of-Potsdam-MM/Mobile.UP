import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NetworkErrorHintComponent } from './network-error-hint.component';

describe('NetworkErrorHintComponent', () => {
  let component: NetworkErrorHintComponent;
  let fixture: ComponentFixture<NetworkErrorHintComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [NetworkErrorHintComponent],
        imports: [IonicModule.forRoot()],
      }).compileComponents();

      fixture = TestBed.createComponent(NetworkErrorHintComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
