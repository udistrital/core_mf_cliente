import { Injectable, Injector, NgZone } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogoFormularioPagadorComponent } from '../dialogo-formulario-pagador/dialogo-formulario-pagador.component';

@Injectable({
  providedIn: 'root'
})
export class DialogoPagadorService {

  constructor(
    private injector: Injector,
    private matDialog: MatDialog,
    private ngZone: NgZone
  ) {}

  /**
   * Abre el diálogo del formulario de pagador
   * @param data Datos a pasar al componente del diálogo
   * @returns MatDialogRef con el resultado del diálogo
   */
  openDialogoPagador(data: any = {}): MatDialogRef<DialogoFormularioPagadorComponent> {
    return this.ngZone.run(() =>
      this.matDialog.open(DialogoFormularioPagadorComponent, {
        width: '900px',
        maxWidth: '95vw',
        disableClose: false,
        data: data
      })
    );
  }
}
