import { Injectable } from '@angular/core';
import { MenuService } from './menu.service';
import { Subscription, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ControlSizeContainerService {
  private subscription?: Subscription;
  private marginLeft$ = new BehaviorSubject<string>('0px'); // BehaviorSubject para manejar el estado del margen

  private containerElement?: HTMLElement;
  private coreElement?: HTMLElement;
  private lastMargin: string = '0px'; // Para controlar la última actualización y evitar ciclos innecesarios

  constructor(private menuService: MenuService) {
    // Cachear los elementos del DOM una sola vez para mejorar el rendimiento
    this.cacheDOMElements();

    this.subscription = this.menuService.sidebar$.subscribe(
      (opened: boolean) => {
        this.updateMargin(opened);
      }
    );

    // Suscribirse a los cambios de margen y aplicarlos de manera óptima
    this.marginLeft$.subscribe(margin => {
      // Solo aplica cambios si son necesarios
      if (margin !== this.lastMargin) {
        window.requestAnimationFrame(() => {
          if (this.containerElement) {
            this.containerElement.style.marginLeft = margin;
          }
          if (this.coreElement) {
            this.coreElement.style.marginLeft = margin;
          }
        });
        this.lastMargin = margin; // Actualizar el último margen conocido
      }
    });
  }

  private cacheDOMElements(): void {
    this.containerElement = document.getElementById('container') as HTMLElement;
    this.coreElement = document.getElementById('core') as HTMLElement;
  }

  private updateMargin(opened: boolean): void {
    const sidebarWidth = opened ? '334px' : '0px'; // Asumiendo 334px como el ancho estándar del sidebar
    this.marginLeft$.next(sidebarWidth);
  }

  public cleanup(): void {
    this.subscription?.unsubscribe();
  }
}
