import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogoFormularioPagadorComponent } from './dialogo-formulario-pagador.component';

describe('DialogoFormularioPagadorComponent', () => {
  let component: DialogoFormularioPagadorComponent;
  let fixture: ComponentFixture<DialogoFormularioPagadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoFormularioPagadorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogoFormularioPagadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
