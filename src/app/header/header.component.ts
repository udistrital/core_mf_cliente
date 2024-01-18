import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter, OnChanges } from '@angular/core';
import { fromEvent } from 'rxjs';
import { MenuService } from '../services/menu.service';
import { MenuAplicacionesService } from './../services/menuAplicaciones.service';
import { MenuAplicacionesComponent } from '../menu-aplicaciones/menu-aplicaciones.component';


enum VisibilityState {
  Visible = 'visible',
  Hidden = 'hidden'
}
@Component({
  selector: 'ng-uui-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone:true,
  imports:[MenuAplicacionesComponent, ],
  encapsulation: ViewEncapsulation.Emulated,
  animations: [
    trigger('iconAnimation', [
      state(
        VisibilityState.Hidden,
        style({ transform: 'scaleX(0) translate(-150%)' })
      ),
      state(
        VisibilityState.Visible,
        style({ transform: 'scaleX(1) translate(0%' })
      ),
      transition('* => *', animate('300ms ease-in'))
    ]),
    trigger('logoAnimation', [
      state(
        VisibilityState.Hidden,
        style({ transform: 'scaleX(0) translate(-150%)' })
      ),
      state(
        VisibilityState.Visible,
        style({ transform: 'scaleX(1)  translate(-28%)' })
      ),
      transition('* => *', animate('300ms ease-in'))
    ]),
    trigger('iconMenu', [
      state(
        VisibilityState.Hidden,
        style({ transform: 'translate(3em, 0)' })
      ),
      state(
        VisibilityState.Visible,
        style({ transform: 'translate(0em, 0)' })
      ),
      transition('* => *', animate('300ms ease-in'))
    ]),
  ]
})
export class HeaderComponent implements OnChanges {
  sidebar = false;
  load = true;
  basePathAssets = 'https://pruebasassets.portaloas.udistrital.edu.co/'
  @Input('appname') appname: any;
  @Input('username') username: any;
  @Input('notificaciones') notificaciones: any;
  @Input('menuApps') menuApps: any;
  @Output('logoutEvent') logoutEvent: EventEmitter<any> = new EventEmitter();
  cerrarSesion: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private menuService: MenuService,
    public menuAplicacionesService: MenuAplicacionesService,
  ) {
    menuService.sidebar$.subscribe((data) => (this.sidebar = data));
  }

  ngOnInit() {
    const up$ = fromEvent(document, 'mouseup');
    up$.subscribe((data: any) => {
        if (this.cerrarSesion) {
            if (((data.path
                .map((info: any) => { return (info.localName) }))
                .filter((data: any) => (data === 'header-button-cerrarsesion-container'))).length === 0) {
                this.toogleCerrarSesion();
            }
        }
    });
  }

  sidebarClases = {
    open: false,
    sidebarDivClase: 'sidebar_off',
    sidebarContainerClase: 'main-container-sidebar-off',
    containerDivClase: 'container-view',
    containerBodyClase: 'container-body',
    containerLogoCollapsedClase: 'inline-block',
    containerLogoClase: 'none',
    textoMenuLateralClase: 'menulateral-text'
  };

  notificacion = {
    open: false,
    clase: 'notificacion_container'
  };

  logout(): void {
    this.logoutEvent.next('clicked')
  }

  ngOnChanges(changes:any): void {
    if (changes.appname !== undefined) {
      if (changes.appname.currentValue !== undefined) {
        this.appname = changes.appname.currentValue;
      }
    }
  }
  toogleCerrarSesion(): void {
    const buttonCerrarSesion = document.getElementById('header-button-cerrarsesion-container');
    if (buttonCerrarSesion?.style.display === 'none' || buttonCerrarSesion?.style.display === '') {
      this.cerrarSesion = true;
      buttonCerrarSesion.style.display = 'block';
    } else {
      this.cerrarSesion = false;
      buttonCerrarSesion!.style.display = 'none';
    }
  }

  toogleAplicaciones(): void {
    this.menuAplicacionesService.toogleMenuNotify();
  }

  // togglenotify(): void {
  //   this.notioasService.toogleMenuNotify();
  // }

  openSidebar(): void {
    this.menuService.openNav();
  }

  closeSidebar(): void {
    this.menuService.closeNav();
  }

}