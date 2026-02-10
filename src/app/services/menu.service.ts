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
      const menu = JSON.parse(atob(menuInfo));
      this.restoreExpandedState(menu);
      this.menuSubject.next(menu);
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
  
  public collapseAllMenusExcept(exceptId: string) {
    const menuInfo = localStorage.getItem('menu');
    if (menuInfo) {
      const menu = JSON.parse(atob(menuInfo));
      
      this.collapseAllRecursive(menu);
      
      this.expandItemAndParents(menu, exceptId);
      
      localStorage.setItem('menu', btoa(JSON.stringify(menu)));
      this.menuSubject.next(menu); 
    }
  }
  
  private collapseAllRecursive(items: any[]) {
    items.forEach(item => {
      item.expanded = false;
      if (item.Opciones && item.Opciones.length > 0) {
        this.collapseAllRecursive(item.Opciones);
      }
    });
  }
  
  private expandItemAndParents(items: any[], itemId: string): boolean {
    for (const item of items) {
      if (String(item.Id) === String(itemId)) {
        item.expanded = true;
        return true;
      }
      
      if (item.Opciones && item.Opciones.length > 0) {
        if (this.expandItemAndParents(item.Opciones, itemId)) {

          item.expanded = true;
          return true;
        }
      }
    }
    return false;
  }
  
  private collapseMenusRecursive(items: any[]) {
    items.forEach(item => {
      item.expanded = false; 
    });
  }

  private collapseMenusRecursiveExcept(items: any[], exceptId: string) {
    items.forEach(item => {
      if (item.Id !== exceptId) {
        item.expanded = false;
      }
      
      if (item.Opciones && item.Opciones.length > 0) {
        this.collapseMenusRecursiveExcept(item.Opciones, exceptId);
      }
    });
  }

  private restoreExpandedState(items: any[]) {
    const selectedMenuId = this.getSelectedMenuId();
    if (!selectedMenuId) return;

    const restored = this.restoreExpandedStateRecursive(items, selectedMenuId);
  }

  private restoreExpandedStateRecursive(items: any[], selectedId: string): boolean {
    for (const item of items) {
      
      if (item.Opciones && item.Opciones.length > 0) {
        for (const child of item.Opciones) {

          if (String(child.Id) === String(selectedId)) {
            item.expanded = true;
            return true;
          }
        }
        
        const childIsSelected = this.restoreExpandedStateRecursive(item.Opciones, selectedId);
        if (childIsSelected) {
          item.expanded = true;
          return true;
        }
      }
    }
    return false;
  }

  private getSelectedMenuId(): string | null {
    const selectedMenuEncoded = localStorage.getItem('select');
    if (!selectedMenuEncoded) {
      return null;
    }
    try {
      const decoded = atob(selectedMenuEncoded);
      return decoded;
    } catch (e) {
      try {
        const parsed = JSON.parse(selectedMenuEncoded);
        return parsed;
      } catch {
        return selectedMenuEncoded;
      }
    }
  }
  
  
}
