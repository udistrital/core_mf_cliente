import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  Component,
  Input,
  ViewEncapsulation,
  ChangeDetectorRef,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { fromEvent } from 'rxjs';
import { MenuService } from '../services/menu.service';
import { MenuAplicacionesService } from './../services/menuAplicaciones.service';
import { MenuAplicacionesComponent } from '../menu-aplicaciones/menu-aplicaciones.component';
import { TranslateService } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../services/users.service';

enum VisibilityState {
  Visible = 'visible',
  Hidden = 'hidden',
}
@Component({
  selector: 'ng-uui-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [MenuAplicacionesComponent, MatSelectModule, RouterModule],
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
      transition('* => *', animate('300ms ease-in')),
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
      transition('* => *', animate('300ms ease-in')),
    ]),
    trigger('iconMenu', [
      state(VisibilityState.Hidden, style({ transform: 'translate(3em, 0)' })),
      state(VisibilityState.Visible, style({ transform: 'translate(0em, 0)' })),
      transition('* => *', animate('300ms ease-in')),
    ]),
  ],
})
export class HeaderComponent implements OnChanges {
  sidebar = false;
  load = true;
  basePathAssets = 'https://pruebasassets.portaloas.udistrital.edu.co/';
  @Input('appname') appname: any;
  @Input('username') username: any;
  @Input('notificaciones') notificaciones: any;
  @Input('menuApps') menuApps: any;
  @Output('logoutEvent') logoutEvent: EventEmitter<any> = new EventEmitter();
  cerrarSesion: boolean = false;

  langs: string[] = ['es', 'en']; // idiomas que va a soportar nuestra aplicacion
  langCookie: string = 'en';

  whatLang$ = fromEvent(window, 'lang');

  constructor(
    private cdr: ChangeDetectorRef,
    private menuService: MenuService,
    public menuAplicacionesService: MenuAplicacionesService,
    private translate: TranslateService,
    private userService: UserService
  ) {
    this.validateLang();
    menuService.sidebar$.subscribe((data) => (this.sidebar = data));
  }

  ngOnInit() {
    const up$ = fromEvent(document, 'mouseup');
    up$.subscribe((data: any) => {
      if (this.cerrarSesion) {
        if (
          data.path
            .map((info: any) => {
              return info.localName;
            })
            .filter(
              (data: any) => data === 'header-button-cerrarsesion-container'
            ).length === 0
        ) {
          this.toogleCerrarSesion();
        }
      }
    });
    this.langCookie = getCookie('lang') || 'es';
    this.translate.setDefaultLang(this.langCookie);
    this.cdr.detectChanges();
  }

  cambiarIdioma(lang: string) {
    this.langCookie = lang;
    setCookie('lang', this.langCookie);
    let event = new CustomEvent('lang', {
      detail: {
        answer: lang,
      },
    });
    window.dispatchEvent(event);
    //console.log("cookie lang",this.langCookie)
  }

  validateLang() {
    let lang = getCookie('lang') || 'es';
    this.whatLang$.subscribe((x: any) => {
      lang = x['detail']['answer'];
      this.translate.setDefaultLang(lang);
    });
    this.translate.setDefaultLang(lang);
  }

  sidebarClases = {
    open: false,
    sidebarDivClase: 'sidebar_off',
    sidebarContainerClase: 'main-container-sidebar-off',
    containerDivClase: 'container-view',
    containerBodyClase: 'container-body',
    containerLogoCollapsedClase: 'inline-block',
    containerLogoClase: 'none',
    textoMenuLateralClase: 'menulateral-text',
  };

  notificacion = {
    open: false,
    clase: 'notificacion_container',
  };

  logout(): void {
    this.logoutEvent.next('clicked');
  }

  ngOnChanges(changes: any): void {
    if (changes.appname !== undefined) {
      if (changes.appname.currentValue !== undefined) {
        this.appname = changes.appname.currentValue;
      }
    }
  }
  toogleCerrarSesion(): void {
    const buttonCerrarSesion = document.getElementById(
      'header-button-cerrarsesion-container'
    );
    if (
      buttonCerrarSesion?.style.display === 'none' ||
      buttonCerrarSesion?.style.display === ''
    ) {
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

export function setCookie(name: string, val: string) {
  const date = new Date();
  const value = val;
  // Set it expire in 7 days
  date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000);
  // Set it
  document.cookie =
    name + '=' + value + '; expires=' + date.toUTCString() + '; path=/';
}

export function getCookie(name: string): string | undefined {
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');

  if (parts.length == 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}
