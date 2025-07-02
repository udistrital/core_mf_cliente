import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { ConfiguracionService } from '../services/configuracion.service';
import { ImplicitAutenticationService } from '../services/implicit_autentication.service';
import { MenuService } from '../services/menu.service';
import { MenuAplicacionesService } from '../services/menuAplicaciones.service';
import { NotificacionesService } from '../services/notificaciones.service';
import { catalogo } from './../services/catalogo';
import { HeaderComponent } from '../header/header.component';
import { LoginComponent } from '../login/login.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { lang } from '../services/globals';


// if (!("path" in Event.prototype))
//   Object.defineProperty(Event.prototype, "path", {
//     get: function () {
//       var path = [];
//       var currentElem:any = this.target;
//       while (currentElem) {
//         path.push(currentElem);
//         currentElem = currentElem.parentElement;
//       }
//       if (path.indexOf(window) === -1 && path.indexOf(document) === -1)
//         path.push(document);
//       if (path.indexOf(window) === -1)
//         path.push(window);
//       console.log('path',path)
//       return path;
//     }
//   });

@Component({
  selector: 'ng-uui-oas',
  templateUrl: './oas.component.html',
  standalone: true,
  imports: [HeaderComponent, LoginComponent, SidebarComponent, FooterComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrls: ['./oas.component.scss'],
})
export class OasComponent implements OnChanges {
  @Output('user') user: EventEmitter<any> = new EventEmitter();
  @Output('option') option: EventEmitter<any> = new EventEmitter();
  @Output('logout') logout: EventEmitter<any> = new EventEmitter();
  // tslint:disable-next-line: no-input-rename
  @Input('environment') environment: any;
  private entornoListo = false;
  CONFIGURACION_SERVICE: any;
  opened = false;
  isLogin = false;
  isloading = false;
  tienePermiso = false;
  userInfo = null;
  userInfoService = null;
  username = '';
  entorno: any;
  navItems: any;
  appname = '';
  appMenu = '';
  notificaciones = false;
  menuApps = false;

  constructor(
    private confService: ConfiguracionService,
    private notificacionesService: NotificacionesService,
    private menuAppService: MenuAplicacionesService,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef,
    private autenticacionService: ImplicitAutenticationService
  ) {
    this.menuService.sidebar$.subscribe((opened) => (this.opened = opened));
    this.menuService.option$.subscribe((op) => {
      setTimeout(() => this.option.emit(op), 100);
    });
    this.autenticacionService.logout$.subscribe((logoutEvent: any) => {
      if (logoutEvent) {
        this.logout.emit(logoutEvent);
      }
    });
  }

  ngOnChanges(changes: any): void {
    const nuevoEnv = changes.environment?.currentValue;
    if (nuevoEnv) {
      this.procesarEnvironment(nuevoEnv);
    }
  }

  private async procesarEnvironment(env: any): Promise<void> {
    const {
      CONFIGURACION_SERVICE,
      entorno,
      notificaciones,
      menuApps,
      appMenu,
      navItems,
      appname,
      autenticacion,
      TOKEN
    } = env;

    // Seteo de variables de entorno
    this.appMenu = appMenu;
    this.navItems = navItems;
    this.appname = appname;
    this.entorno = entorno;
    this.notificaciones = notificaciones;
    this.menuApps = menuApps;
    this.CONFIGURACION_SERVICE = CONFIGURACION_SERVICE;
    lang.lang = TOKEN.REDIRECT_URL;
    this.entornoListo = true;
    this.isloading = true;

    try {
      if (autenticacion) {
        await this.autenticacionService.init(TOKEN);
        this.autenticacionService.login(true);
        this.suscribirUsuario();
      }
    } catch (error) {
      console.error('Fallo autenticación:', error);
    } finally {
      this.isloading = false;
    }
  }

  private suscribirUsuario(): void {
    this.autenticacionService.user$.subscribe((data: any) => {
      if (!this.entornoListo) return;

      if (data?.user && data?.userService) {
        this.userInfo = data.user;
        this.userInfoService = data.userService;
        this.username = data.user?.email ?? '';
        this.user.emit(data);

        if (this.notificaciones) {
          this.notificacionesService.init(data);
        }

        if (this.menuApps && this.entorno) {
          const catalogoEntorno = catalogo[this.entorno as keyof typeof catalogo];
          this.menuAppService.init(catalogoEntorno, data);
        }

        const rolesPermitidos = [
          'ESTUDIANTE', 'DOCENTE', 'DECANO', 'COORDINADOR', 'ADMIN_DOCENCIA', 'ADMIN_SGA'
        ];

        const tieneRolValido = data.userService.role?.some((rol: any) =>
          rolesPermitidos.includes(rol)
        );

        this.tienePermiso = true;
        this.isLogin = true;
        this.isloading = false;
        this.cdr.detectChanges();
      } else {
        this.isLogin = false;
        this.tienePermiso = false;
        this.isloading = false;
      }
    });
  }

  loginEvent(): void {
    this.autenticacionService.getAuthorizationUrl();
  }

  logoutEvent(): void {
    this.autenticacionService.logout('action-event');
  }

  ngOnInit(): void {
    // if (this.environment) {
    //   this.procesarEnvironment(this.environment);
    // }
  }
}
