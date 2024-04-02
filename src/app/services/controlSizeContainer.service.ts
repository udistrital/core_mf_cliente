import { Injectable } from "@angular/core";
import { MenuService } from "./menu.service";
import { Subscription } from "rxjs";

@Injectable({
    providedIn: 'root',
  })
  
  export class ControlSizeContainerService {
    
    private subscription?: Subscription;

    constructor( private menuService: MenuService){
        this.subscription = this.menuService.sidebar$.subscribe(
            (opened: boolean) => {
                opened ? this.open() : this.close();
            }
        );
    }

    private open():void {
        try {
            const container = document.getElementById('container');
            const sidebar = document.getElementById('sidebar');
            const core = document.getElementById('core');
            let width = 334;
            if (sidebar) {
              width = sidebar.offsetWidth;
              if (container) {
                container.style.marginLeft = `${width}px`;
              }
              if (core) {
                core.style.marginLeft = `${width}px`;
              }
            }
          } catch (e) {
            console.error('Error en openSidebar en el componente header: ', e);
          }
    }

    private close(): void {
        try {
            const container = document.getElementById('container');
            const core = document.getElementById('core');
            if (container) {
              container.style.marginLeft = `0px`;
            }
            if (core) {
              core.style.marginLeft = `0px`;
            }
          } catch (e) {
            console.error('Error en closeSidebar en el componente header: ', e);
          }
    }

    public cleanup(): void {
        this.subscription?.unsubscribe();
    }
  }
