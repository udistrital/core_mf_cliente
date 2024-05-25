import { Injectable } from '@angular/core';
import { ConfiguracionService } from './configuracion.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { fromEvent } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  public notificaciones: any[] = [];
  private notificacionesSubject = new Subject<any[]>();
  public notificaciones$ = this.notificacionesSubject.asObservable();

  public numPendientes: number = 0;
  private numPendientesSubject = new BehaviorSubject(0);
  public numPendientes$ = this.numPendientesSubject.asObservable();

  private menuActivoSubject = new BehaviorSubject(false);
  public menuActivo$ = this.menuActivoSubject.asObservable();

  private loading = new BehaviorSubject(false);
  public loading$ = this.loading.asObservable();

  private notificacionSubject = new BehaviorSubject(false);
  public notificacion$ = this.notificacionSubject.asObservable();

  rol: any;
  usuario: any;
  nombreCola: string = '';
  path: string = '';

  constructor(private confService: ConfiguracionService) {
    //Cerrar el panel de notificaciones al hacer clic por fuera de el
    fromEvent<KeyboardEvent>(document, 'mouseup').subscribe(
      (data: KeyboardEvent) => {
        if (this.menuActivoSubject) {
          if (
            data
              .composedPath()
              .map((info: any) => info.localName)
              .filter((dataFilter: any) => dataFilter === 'ng-uui-notioas')
              .length === 0
          ) {
            this.closePanel();
          }
        }
      }
    );
  }

  toogleMenuNotify(): void {
    this.menuActivoSubject.next(true);
  }

  closePanel(): void {
    console.log('entra acá?');

    this.menuActivoSubject.next(false);
  }

  init(path: string, usuario: any): void {
    this.path = path;
    if (typeof usuario.userService !== 'undefined') {
      this.usuario = usuario.userService;
      this.rol = usuario.userService.role[0] ?? '';
      this.nombreCola = 'colaJefeUnidad'; // !!!!  CAMBIAR !!!!
      this.queryNotifications('');
    }
  }

  changeStateToView(notificacion: any): void {
    let cuerpoMensaje = notificacion.Body;
    if (cuerpoMensaje.MessageAttributes.EstadoMensaje.Value == 'pendiente') {
      this.numPendientesSubject.next(0);
      this.queryNotifications(cuerpoMensaje.MessageId); // Cambia el estado a revisado
    }
    this.notificacionSubject.next(notificacion);
  }

  queryNotifications(id: string): void {
    this.loading.next(true);

    if (this.usuario.documento === '') {
      this.loading.next(false);
      return;
    }

    let url: string;
    if (id != '') {
      url = `colas/mensajes/usuario?nombre=${this.nombreCola}.fifo&usuario=${this.usuario.documento}&idMensaje=${id}`;
    } else {
      url = `colas/mensajes/usuario?nombre=${this.nombreCola}.fifo&usuario=${this.usuario.documento}`;
    }
    this.confService.getWithoutPath(`${this.path}${url}`).subscribe(
      (res: any) => {
        if (res && res.Data) {
          this.notificaciones = res.Data;
          this.numPendientes = this.notificaciones.filter(
            (mensaje: any) =>
              mensaje.Body.MessageAttributes.EstadoMensaje.Value === 'pendiente'
          ).length;
          this.numPendientesSubject.next(this.numPendientes);
          this.notificacionesSubject.next(this.notificaciones);
        }
        this.loading.next(false);
      },
      (error: any) => {
        console.log(error);
        this.loading.next(false);
      }
    );
  }
}
