import { Injectable } from '@angular/core';
import { ConfiguracionService } from './configuracion.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { fromEvent } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificacionesService {
  public notificaciones: any = [];
  private notificacionesSubject = new Subject<any[]>();
  public notificaciones$ = this.notificacionesSubject.asObservable();

  public numPendientes: number = 0;
  private numPendientesSubject = new BehaviorSubject<number>(0);
  public numPendientes$ = this.numPendientesSubject.asObservable();

  private menuActivoSubject = new BehaviorSubject<boolean>(false);
  public menuActivo$ = this.menuActivoSubject.asObservable();

  private loading = new BehaviorSubject<boolean>(true);
  public loading$ = this.loading.asObservable();

  private notificacionSubject = new BehaviorSubject<any>(null);
  public notificacion$ = this.notificacionSubject.asObservable();

  public notificacionesNoLeidas: any = [];
  public notificacionesLeidas: any = [];

  private socket$: WebSocketSubject<any> | undefined;
  
  private ws: string | undefined;
  private crud: string | undefined;
  private documentoUsuario: string | undefined;

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

  // Conexión por WebSocket
  connectWebSocket(docUsuario:string){
    if (!this.ws) {
      console.error('URL del WebSocket no está definida');
      return;
    }

    this.socket$ = new WebSocketSubject(this.ws);

    this.socket$.subscribe((notificacion) => {
      this.numPendientes++;
      this.numPendientesSubject.next(this.numPendientes);
      this.notificacionesNoLeidas.unshift(notificacion);
      this.updateNotifications();
    });

    // Enviar el docuemento de usuario al servidor cuando se establezca la conexión
    this.socket$.next(docUsuario + "wc");
  }

  toogleMenuNotify(): void {
    this.menuActivoSubject.next(true);
  }

  closePanel(): void {
    this.menuActivoSubject.next(false);
  }

  init(usuario: any): void {
    this.ws = environment.NOTIFICACION_MID_WS;
    this.crud = environment.NOTIFICACIONES_CRUD;
    this.documentoUsuario = usuario.userService?.documento;
    if (this.documentoUsuario) {            
      this.connectWebSocket(this.documentoUsuario);
      this.queryNotifications();
    }
  }

  // Actualizar lista de notificaciones
  updateNotifications(): void {
    this.notificaciones = [...this.notificacionesNoLeidas, ...this.notificacionesLeidas];
    this.notificacionesSubject.next(this.notificaciones);
  }

  // Actualizar notificación
  changeStateToView(notificacion: any): void {
    if (!notificacion.lectura) {
      this.loading.next(true);
      this.numPendientes--;
      this.numPendientesSubject.next(this.numPendientes);

      this.confService.putWithoutPath(`${this.crud}notificacion/${notificacion._id}`, {}).subscribe(
        (res: any) => {
          if (res?.Data) {
            notificacion.lectura = true;  // Cambiar el estado de la notificación a leida

            // Eliminar notificación de la lista de notificaciones no leidas
            this.notificacionesNoLeidas = this.notificacionesNoLeidas.filter(
              (no_leida:any) => no_leida._id !== notificacion._id
            );

            // Agregar notificación al inicio de las notificaciones leidas 
            this.notificacionesLeidas.unshift(notificacion); 

            // Mantener únicamente 5 notificaciones leidas
            if (this.notificacionesLeidas.length > 5) {
              this.notificacionesLeidas.pop();
            }
                                  
            this.updateNotifications();
            this.loading.next(false);
            setTimeout(() => this.closePanel(), 1000);
          }
        }, 
        (error: any) => {
          console.error(error);
          this.loading.next(false);
          setTimeout(() => this.closePanel(), 1000);
        }
      )
    }
    this.notificacionSubject.next(notificacion);
  }

  // Consultar listado de notificaciones
  queryNotifications(): void {
    if (this.documentoUsuario === "") {
      this.loading.next(false);
      return;
    }

    this.loading.next(true);

    const query = `notificacion?query=destinatario:${this.documentoUsuario}`;
    const noLeidasQuery = `,lectura:false,&sortby=fecha_creacion&order=desc&limit=0`;
    const leidasQuery = `,lectura:true,&sortby=fecha_lectura&order=desc&limit=5`;

    this.confService.getWithoutPath(`${this.crud}${query + noLeidasQuery}`).subscribe(
      (res: any) => {
        if (res?.Data) {
          this.notificacionesNoLeidas = res.Data;
          this.numPendientes = res.Data.length;
          
          this.confService.getWithoutPath(`${this.crud}${query + leidasQuery}`).subscribe(
            (res: any) => {
              if (res?.Data) {
                this.notificacionesLeidas = res.Data;
                this.numPendientesSubject.next(this.numPendientes);
                this.updateNotifications();
              }
              this.loading.next(false);
            }, (error: any) => {
              console.error(error);
              this.loading.next(false);
            }
          )
        } else {
          this.loading.next(false);
        }
      }, (error: any) => {
        console.error(error);
        this.loading.next(false);
      }
    )
  }
}
