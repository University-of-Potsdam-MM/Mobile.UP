import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModulesGridComponent } from './modules-grid.component';

describe('ModulesGridComponent', () => {
  let component: ModulesGridComponent;
  let fixture: ComponentFixture<ModulesGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModulesGridComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModulesGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
