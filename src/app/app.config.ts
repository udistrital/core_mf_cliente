import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { APP_BASE_HREF } from '@angular/common';
import { HttpBackend, HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { getSingleSpaExtraProviders } from 'single-spa-angular';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { environment } from '../environments/environment';
import { OasComponent } from './oas/oas.component';
import { ConfiguracionService } from './services/configuracion.service';
import { lang } from './services/globals';
import { MatDialog, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { authInterceptor } from './services/auth.interceptor';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

declare let __webpack_public_path__: string;

class CoreTranslateLoader extends TranslateLoader {
  constructor(private http: HttpClient) {
    super();
  }

  getTranslation(lang: string): Observable<Record<string, unknown>> {
    const rootUrl = `/assets/i18n/${lang}.json`;
    const coreBase = typeof __webpack_public_path__ === 'string'
      ? __webpack_public_path__
      : '/';
    const coreUrl = `${coreBase}assets/i18n/${lang}.json`;
    const urls = Array.from(new Set([rootUrl, coreUrl]));

    return forkJoin(
      urls.map((url) =>
        this.http
          .get<Record<string, unknown>>(url)
          .pipe(catchError(() => of({})))
      )
    ).pipe(
      map((translations) =>
        translations.reduce(
          (merged, current) => ({ ...merged, ...current }),
          {}
        )
      )
    );
  }
}

export function createTranslateLoader(handler: HttpBackend) {
  return new CoreTranslateLoader(new HttpClient(handler));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: APP_BASE_HREF, useValue: '/' },
    BrowserAnimationsModule,
    provideAnimations(),
    getSingleSpaExtraProviders(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
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
        deps: [HttpBackend],
        useFactory: createTranslateLoader
      }
    }).providers!
  ]
};
