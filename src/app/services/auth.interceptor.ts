import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ImplicitAutenticationService } from './implicit_autentication.service';

export function authInterceptor(request: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(ImplicitAutenticationService);
  const token = authService.getAccessToken();
  const authenticatedRequest = token && authService.shouldAttachToken(request.url)
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authService.shouldAttachToken(request.url)) {
        authService.handleUnauthorized();
      }
      return throwError(() => error);
    })
  );
}
