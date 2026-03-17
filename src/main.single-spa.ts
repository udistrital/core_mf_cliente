import { enableProdMode, NgZone, Injector } from '@angular/core';

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { Router, NavigationStart } from '@angular/router';

import { singleSpaAngular, getSingleSpaExtraProviders } from 'single-spa-angular';


import { environment } from './environments/environment';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { DialogoFormularioPagadorComponent } from './app/dialogo-formulario-pagador/dialogo-formulario-pagador.component';
import { DialogoPagadorService } from './app/services/dialogo-pagador.service';

// Exportar componentes y servicios públicos
export { DialogoFormularioPagadorComponent } from './app/dialogo-formulario-pagador/dialogo-formulario-pagador.component';
export { DialogoPagadorService } from './app/services/dialogo-pagador.service';

// Variable global para almacenar el injector
let coreInjector: Injector | null = null;

if (environment.production) {
  enableProdMode();
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: singleSpaProps => {
    singleSpaPropsSubject.next(singleSpaProps);
    return bootstrapApplication(AppComponent, appConfig).then(moduleRef => {
      // Guardar la referencia al injector después de que la app se haya inicializado
      coreInjector = moduleRef.injector;
      
      // Exponer el servicio globalmente
      if (!(<any>window)['core-mf']) {
        (<any>window)['core-mf'] = {};
      }
      
      (<any>window)['core-mf'].DialogoPagadorService = coreInjector.get(DialogoPagadorService);
      (<any>window)['core-mf'].DialogoFormularioPagadorComponent = DialogoFormularioPagadorComponent;
      
      return moduleRef;
    });
  },
  template: '<core-mf class="mat-typography" />',
  Router,
  NavigationStart,
  NgZone,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
