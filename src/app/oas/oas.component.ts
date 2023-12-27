import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, ViewEncapsulation } from '@angular/core';
import { ConfiguracionService } from '../services/configuracion.service';
import { ImplicitAutenticationService } from '../services/implicit_autentication.service';
import { MenuService } from '../services/menu.service';
import { MenuAplicacionesService } from '../services/menuAplicaciones.service';
import { catalogo } from './../services/catalogo';
import { HeaderComponent } from '../header/header.component';
import { LoginComponent } from '../login/login.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

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
  imports:[HeaderComponent,LoginComponent,SidebarComponent,FooterComponent],
  encapsulation: ViewEncapsulation.Emulated,
  styleUrls: ['./oas.component.scss']
})
export class OasComponent implements OnChanges {
  @Output('user') user: EventEmitter<any> = new EventEmitter();
  @Output('option') option: EventEmitter<any> = new EventEmitter();
  @Output('logout') logout: EventEmitter<any> = new EventEmitter();
  // tslint:disable-next-line: no-input-rename
  @Input('environment') environment: any;
  opened: boolean = false;
  isLogin = false;
  userInfo = null;
  userInfoService = null;
  appname: string='';
  appMenu: string='';
  username:string= '';
  isloading: boolean=false;
  notificaciones:boolean= false;
  menuApps:boolean= false;
  CONFIGURACION_SERVICE: any;
  NOTIFICACION_SERVICE: any;
  entorno: any;
  navItems: any;
  constructor(
    private confService: ConfiguracionService,
    private menuAppService: MenuAplicacionesService,
    private menuService: MenuService,
    private cdr: ChangeDetectorRef,
    private autenticacionService: ImplicitAutenticationService,
  ) {
    console.log('hola')
    this.menuService.sidebar$.subscribe((opened) => (this.opened = opened));
    this.menuService.option$.subscribe((op) => {
      setTimeout(() => (this.option.emit(op)), 100)
    });
    this.autenticacionService.logout$.subscribe((logoutEvent: any) => {
      if (logoutEvent) {
        this.logout.emit(logoutEvent);
      }
    })
    this.autenticacionService.user$.subscribe((data: any) => {
      console.log("data user",data)
      console.log(this.isLogin)
      if (JSON.stringify(data) !== '{}' && this.username !== '') {
        setTimeout(() => {
          console.log(this.userInfo)
          console.log(this.userInfoService)
          console.log(this.username)
          if ((data.user && data.userService) && (!this.userInfo && !this.userInfoService) && this.username !== '') {
            this.userInfo = data.user;
            this.userInfoService = data.userInfoService
            this.user.emit(data)
            if (this.menuApps) {
              this.menuAppService.init(catalogo[this.entorno as keyof typeof catalogo], data);
            }
            this.username = data.user ? data.user.email ? data.user.email : '' : '';
            this.isLogin = false;
            this.isloading = true;
          } else {
            this.isLogin = true;
            // setTimeout(() => { this.isloading ? this.isloading = false : this.isloading = true }, 2500)
          }
        }
          , 100)
      } else {
        this.isLogin = true;
        this.isloading = true;
        setTimeout(() => { this.isloading ? this.isloading = false : this.isloading = true }, 2500)

      }
      console.log(this.isLogin)

    })
  }
  title = 'app-client';

  ngOnChanges(changes:any): void {
    console.log(changes)
    if (changes.environment !== undefined) {
      if (changes.environment.currentValue !== undefined) {
        console.log(changes.environment.currentValue)
        const { CONFIGURACION_SERVICE, NOTIFICACION_SERVICE, entorno, notificaciones, menuApps, appMenu, navItems, appname, autenticacion, TOKEN } = changes.environment.currentValue;
        this.appMenu = appMenu;
        this.navItems = navItems;
        this.appname = appname;
        this.notificaciones = notificaciones;
        this.menuApps = menuApps;
        this.entorno = entorno;
        this.CONFIGURACION_SERVICE = CONFIGURACION_SERVICE;
        this.NOTIFICACION_SERVICE = NOTIFICACION_SERVICE;
        if (autenticacion) {
          console.log('token',TOKEN)
          this.autenticacionService.init(TOKEN);
          this.autenticacionService.login(true);
        }
      }
    }
  }

  loginEvent() {
    this.autenticacionService.getAuthorizationUrl();
  }

  logoutEvent() {
    this.autenticacionService.logout('action-event');
  }

  ngOnInit() {

  }

}
