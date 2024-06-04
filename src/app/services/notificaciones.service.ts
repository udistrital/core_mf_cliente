import { Injectable } from '@angular/core';
import { ConfiguracionService } from './configuracion.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { fromEvent } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

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

  docUsuario: string = '';
  cola: string = '';

  constructor(private router: Router, private confService: ConfiguracionService) {
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
    this.menuActivoSubject.next(false);
  }

  init(colas: any, usuario: any, entorno: string): void {
    const userService = usuario.userService;
    if (userService && colas) {
      this.docUsuario = userService.documento;
      let roles = userService.role;

      // Obtener el nombre de la cola a partir del rol y dependiendo del entorno
      let rol = Object.keys(colas).find((rol) => roles.includes(rol)) ?? null;
      if (rol) {
        this.cola = entorno == 'test' ? `cola${colas[rol]}` : colas[rol];
        this.queryNotifications();
      }
    }
  }

  changeStateToView(notificacion: any): void {
    let cuerpoMensaje = notificacion.Body;
    if (cuerpoMensaje.MessageAttributes.EstadoMensaje.Value == 'pendiente') {
      this.numPendientesSubject.next(0);
      this.queryNotifications(cuerpoMensaje.MessageId); // Cambiar estado a revisado
    }
    this.goTo(notificacion)
  }

  goTo(notificacion: any) {
    if (typeof notificacion.Body.MessageAttributes.Url != "undefined") {
      let url = `/${notificacion.Body.MessageAttributes.Url.Value}`
      localStorage.setItem("notificacion", JSON.stringify(notificacion))
      
      if (this.router.url != url) {
        this.router.navigate([url]);
      } else {
        let event = new CustomEvent("notificacion")
        window.dispatchEvent(event)
      }
    }
  }

  queryNotifications(id: string = ''): void {
    this.loading.next(true)

    if (this.docUsuario === "") {
      this.loading.next(false);
      return;
    }

    const endpoint = `colas/mensajes/usuario?nombre=${this.cola}.fifo&usuario=${this.docUsuario}`;
    const url = id ? `${endpoint}&idMensaje=${id}` : endpoint;
    this.confService.getWithoutPath(`${environment.NOTIFICACION_MID_SERVICE}${url}`).subscribe(
      (res: any) => {
        if (res && res.Data) {
          this.notificaciones = res.Data;
          this.numPendientes = this.notificaciones.filter(
            (mensaje:any) => mensaje.Body.MessageAttributes.EstadoMensaje.Value === "pendiente"
          ).length; 
          this.numPendientesSubject.next(this.numPendientes);
          this.notificacionesSubject.next(this.notificaciones);
        }
        this.loading.next(false)
      }, (error: any) => {
        console.log(error);
        this.loading.next(false);
      }
    )
  }
}
