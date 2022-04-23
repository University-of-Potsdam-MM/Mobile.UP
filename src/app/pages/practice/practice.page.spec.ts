import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PracticePage } from './practice.page';

describe('PracticePage', () => {
  let component: PracticePage;
  let fixture: ComponentFixture<PracticePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PracticePage],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
