import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificacionesService } from './../services/notificaciones.service';
import { LoadComponent } from '../load/load.component';
import { trigger, state, style, transition, animate } from '@angular/animations';
import moment from 'moment';
import 'moment/locale/es';

@Component({
  selector: 'ng-uui-notioas',
  templateUrl: './notioas.component.html',
  standalone: true,
  imports: [CommonModule, LoadComponent],
  styleUrls: ['./notioas.component.scss'],
  animations: [
    trigger('cardAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-20px)'
      })),
      state('*', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => *', [
        animate('300ms ease-out')
      ])
    ]),
  ]
})
export class NotioasComponent implements OnInit {  
  menuActivo: boolean = false;
  loading: boolean = true;
  notificaciones: any[] = [];

  constructor(private router: Router, public notificacionesService: NotificacionesService) {
    this.notificacionesService.notificacion$.subscribe((notificacion) => {
      this.goTo(notificacion);
    });
  }

  ngOnInit(): void {
    moment.locale('es');
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

  redirect(notificacion: any) {
    this.notificacionesService.changeStateToView(notificacion);
  }

  goTo(notificacion: any) {
    if (notificacion?.metadatos?.modulo) {
      let url = `/${notificacion.metadatos.modulo}`
      localStorage.setItem("notificacion", JSON.stringify(notificacion))

      if (this.router.url != url) {
        this.router.navigate([url]);
      } else {
        let event = new CustomEvent("notificacion")
        window.dispatchEvent(event)
      }
    }
  }

  timeAgo(date: Date): string {
    return moment(date).fromNow();
  }
}
