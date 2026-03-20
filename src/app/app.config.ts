import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { APP_BASE_HREF } from '@angular/common';
import { HttpClient, provideHttpClient, withFetch } from '@angular/common/http';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { OasComponent } from './oas/oas.component';
import { ConfiguracionService } from './services/configuracion.service';
import { lang } from './services/globals';
import { MatDialog, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';



export function createTranslateLoader(http: HttpClient) {
  // Apunta a /assets/i18n/ (raíz del servidor)
  // Esto permite que se compartan las traducciones del root (sga_cliente_root)
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: '/' },
    BrowserAnimationsModule,
    provideAnimations(),
    getSingleSpaExtraProviders(),
    provideHttpClient(withFetch()),
    // Configuración de MatDialog
    MatDialog,
    Overlay,
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        hasBackdrop: true,
        disableClose: false,
        width: '800px'
      }
    },
    TranslateModule.forRoot({
      defaultLanguage: 'es',
      loader: {
        provide: TranslateLoader,
        deps: [HttpClient],
        useFactory: createTranslateLoader
      }
    }).providers!
  ]
};
