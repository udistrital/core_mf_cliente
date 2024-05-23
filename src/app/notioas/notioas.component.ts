import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesService } from './../services/notificaciones.service';

@Component({
  selector: 'ng-uui-notioas',
  templateUrl: './notioas.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./notioas.component.scss']
})
export class NotioasComponent implements OnInit {
  @Output() notificacion: EventEmitter<any> = new EventEmitter();
  
  menuActivo: boolean = false;
  loading: boolean = false;
  notificaciones: any[] = [];

  constructor(public notificacionesService: NotificacionesService) {
    this.notificacionesService.notificacion$.subscribe((notificacion) => {
      this.notificacion.emit(notificacion)
    });
  }

  ngOnInit(): void {
    this.subscribeToMenuActivo();
    this.subscribeToLoading();
    this.subscribeToNotificaciones();
  }

  private subscribeToMenuActivo(): void {
    this.notificacionesService.menuActivo$.subscribe((menuActivo: boolean) => {
      this.menuActivo = menuActivo;
    });
  }

  private subscribeToLoading(): void {
    this.notificacionesService.loading$.subscribe((loading: boolean) => {
      this.loading = loading;
    });
  }

  private subscribeToNotificaciones(): void {
    this.notificacionesService.notificaciones$.subscribe((notificaciones: any[]) => {
      this.notificaciones = notificaciones;
    });
  }

  redirect(notificacion:any) {
    this.notificacionesService.changeStateToView(notificacion);
  }
}
