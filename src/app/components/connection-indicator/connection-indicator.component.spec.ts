import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConnectionIndicatorComponent } from './connection-indicator.component';

describe('ConnectionIndicatorComponent', () => {
  let component: ConnectionIndicatorComponent;
  let fixture: ComponentFixture<ConnectionIndicatorComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ConnectionIndicatorComponent],
        imports: [IonicModule.forRoot()],
      }).compileComponents();

      fixture = TestBed.createComponent(ConnectionIndicatorComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
