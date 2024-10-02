import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { ConfiguracionService } from './configuracion.service';
import { ImplicitAutenticationService } from './implicit_autentication.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  public sidebar: boolean = false;

  private optionSubject = new BehaviorSubject(false);
  public option$ = this.optionSubject.asObservable();

  private sidebarSubject = new BehaviorSubject(false);
  public sidebar$ = this.sidebarSubject.asObservable();

  private menuSubject = new BehaviorSubject({});
  public menu$ = this.menuSubject.asObservable();

  constructor(
    private configuracionService: ConfiguracionService,
    private userService: ImplicitAutenticationService,
    private router: Router,
  ) {
    fromEvent<KeyboardEvent>(document, 'mouseup').subscribe(
      (data: KeyboardEvent) => {
        if (this.sidebar) {
          if (
            data
              .composedPath()
              .map((info: any) => info.localName)
              .filter((dataFilter: any) => dataFilter === 'ng-uui-sidebar')
              .length === 0
          ) {
            this.closeNav();
          }
        }
      }
    );
  }

  getMenu(appMenu: string) {
    const menuInfo = localStorage.getItem('menu');
    if (menuInfo) {
      this.menuSubject.next(JSON.parse(atob(menuInfo)));
    } else {
      this.userService.user$.subscribe((userResponse: any) => {
        const { user, userService } = userResponse;
        if (user && userService) {
          const role1 = user
            ? user.role
              ? user.role.filter(
                  (menu: string | string[]) => menu.indexOf('/') === -1
                )
              : []
            : [];
          const role2 = userService
            ? userService.role
              ? userService.role.filter(
                  (menu: string | string[]) => menu.indexOf('/') === -1
                )
              : []
            : [];
          const roles =
            [...role1, ...role2].length > 0
              ? [...role1, ...role2].join(',')
              : '';
          if (roles !== '') {
            this.configuracionService
              .getMenu(roles, appMenu, 'menu_opcion_padre/ArbolMenus')
              .subscribe((data: any) => {
                let navItems = data;
                navItems = [
                  ...[
                    {
                      Nombre: 'Inicio',
                      Icono: 'home',
                      Url: 'pages',
                      Opciones: [],
                    },
                  ],
                  ...navItems,
                ];
                this.updateMenu(navItems);
              });
          }
        }
      });
    }
  }

  public updateOption(option: any) {
    this.optionSubject.next(option);
  }

  public closeNav() {
    this.sidebar = false;
    this.sidebarSubject.next(this.sidebar);
  }

  public updateMenu(menu: any) {
    localStorage.setItem('menu', btoa(JSON.stringify(menu)));
    this.menuSubject.next(menu);
  }

  public openNav() {
    this.sidebar = true;
    this.sidebarSubject.next(this.sidebar);
  }

  public toogle() {
    this.sidebar = !this.sidebar;
    this.sidebarSubject.next(this.sidebar);
  }

  public goTo(url: string) {
    this.router.navigate([url]);
  }

  public collapseAllMenus() {
    
    const menuInfo = localStorage.getItem('menu');
    if (menuInfo) {
      const menu = JSON.parse(atob(menuInfo));
      //console.log(menu);
      this.collapseMenusRecursive(menu); 
      //console.log(menu);
      localStorage.setItem('menu', btoa(JSON.stringify(menu)));
      this.menuSubject.next(menu); 
      this.updateMenu(menu);
    }
  }  
  
  private collapseMenusRecursive(items: any[]) {
    //console.log(items);
    items.forEach(item => {
      //onsole.log(item);
      item.expanded = false; 
    });
  }
  
  
}
