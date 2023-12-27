import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OasComponent } from './oas.component';

describe('OasComponent', () => {
  let component: OasComponent;
  let fixture: ComponentFixture<OasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
