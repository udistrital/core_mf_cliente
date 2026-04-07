import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Md5 } from 'ts-md5';
import { BehaviorSubject, Subscription, of, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ImplicitAutenticationService {
  environment: any;
  logoutUrl: any;
  params: any;
  payload: any;
  timeActiveAlert: number = 4000;
  private user: any;
  private timeLogoutBefore = 1000;
  private timeAlert = 300000;

  private userSubject = new BehaviorSubject({});
  public user$ = this.userSubject.asObservable();

  private menuSubject = new BehaviorSubject({});
  public menu$ = this.menuSubject.asObservable();

  private logoutSubject = new BehaviorSubject('');
  public logout$ = this.logoutSubject.asObservable();

  private eventoCerrarSesionRegistrado = false;

  constructor(private httpClient: HttpClient) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const expires = this.setExpiresAt();
        this.autologout(expires);
      }
    });
    this.añadirEventoParaCerrarSesion();
  }

  ngOnDestroy() {
    this.removerEventoParaCerrarSesion();
  }

  private añadirEventoParaCerrarSesion() {
    if (!this.eventoCerrarSesionRegistrado) {
      window.addEventListener('cerrar-sesion-mf', this.handleCerrarSesion);
      this.eventoCerrarSesionRegistrado = true;
    }
  }

  private removerEventoParaCerrarSesion() {
    if (this.eventoCerrarSesionRegistrado) {
      window.removeEventListener('cerrar-sesion-mf', this.handleCerrarSesion);
      this.eventoCerrarSesionRegistrado = false;
    }
  }

  private handleCerrarSesion = (_event: Event) => {
    this.logout('action-event');
  };

  async init(entorno: any): Promise<void> {
    this.environment = entorno;
    const id_token = window.localStorage.getItem('id_token');

    if (!id_token) {
      const params: { [k: string]: any } = {};
      const regex = /([^&=]+)=([^&]*)/g;
      const queryString = location.hash.substring(1);
      let m;
      while ((m = regex.exec(queryString))) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
      }

      if (params['id_token']) {
        const id_token_array = params['id_token'].split('.');
        const payload = JSON.parse(atob(id_token_array[1]));
        localStorage.setItem('access_token', params['access_token']);
        localStorage.setItem('expires_in', params['expires_in']);
        localStorage.setItem('state', params['state']);
        localStorage.setItem('id_token', params['id_token']);

        await this.updateAuth(payload);
      }
    } else {
      const id_token_parts = id_token.split('.');
      if (id_token_parts?.length === 3) {
        const payload = JSON.parse(atob(id_token_parts[1]));
        await this.updateAuth(payload);
      }
    }

    const expires = this.setExpiresAt();
    this.autologout(expires);
    this.clearUrl();
  }

  async updateAuth(payload: any): Promise<void> {
    const user = localStorage.getItem('user');
    if (user) {
      this.userSubject.next(JSON.parse(atob(user)));
      return;
    }

    try {
      const res = await firstValueFrom(
        this.httpClient.post<any>(
          this.environment.AUTENTICACION_MID,
          { user: payload.email },
          this.getHttpOptions()
        )
      );

      this.clearUrl();

      const userPayload = { user: payload };
      const userServiceResponse = { userService: res };
      // if (!res.role || res.role.length === 0) {
      //   res.role = ['ASPIRANTE'];
      // } else {
      //   const allowedRoles = ['Internal/everyone', 'Internal/selfsignup'];
      //   const hasDisallowedRoles = res.role.some((role: any) => !allowedRoles.includes(role));

      //   if (!hasDisallowedRoles && !res.role.includes('ASPIRANTE')) {
      //     res.role.push('ASPIRANTE');
      //   }
      // }
      res.role.push('ASPIRANTE');

      localStorage.setItem(
        'user',
        btoa(JSON.stringify({ ...userPayload, ...userServiceResponse }))
      );

      this.userSubject.next({ ...userPayload, ...userServiceResponse });
    } catch (error) {
      console.error('Error en updateAuth:', error);
      throw error;
    }
  }

  private getHttpOptions(): { headers: HttpHeaders; observe: 'body' } {
    return {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      }),
      observe: 'body' as const
    };
  }

  public login(flag: any): boolean {
    if (
      localStorage.getItem('id_token') === 'undefined' ||
      localStorage.getItem('id_token') === null ||
      this.logoutValid()
    ) {
      if (!flag) {
        this.getAuthorizationUrl();
      }
      return false;
    }
    return true;
  }

  public logout(action: any): void {
    const state = localStorage.getItem('state');
    const idToken = localStorage.getItem('id_token');
    if (state && idToken) {
      this.logoutUrl = `${this.environment.SIGN_OUT_URL}?id_token_hint=${idToken}`;
      this.logoutUrl += `&post_logout_redirect_uri=${this.environment.SIGN_OUT_REDIRECT_URL}`;
      this.logoutUrl += `&state=${state}`;
      this.clearStorage();
      this.logoutSubject.next(action);
      window.location.replace(this.logoutUrl);
    }
  }

  public getPayload(): any {
    const idToken = localStorage.getItem('id_token')?.split('.');
    return idToken?.length === 3 ? JSON.parse(atob(idToken[1])) : {};
  }

  public logoutValid(): boolean {
    const queryString = location.search.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;
    let m, state;
    while ((m = regex.exec(queryString))) {
      state = decodeURIComponent(m[2]);
    }
    if (localStorage.getItem('state') === state) {
      this.clearStorage();
      return true;
    }
    return false;
  }

  public clearUrl(): void {
    const clean_uri = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, clean_uri);
  }

  public getAuthorizationUrl(): string {
    this.params = this.environment;
    if (!this.params.hasOwnProperty('nonce')) {
      const nonceData = this.generateState();
      this.params = { ...this.params, nonce: nonceData };
    }
    if (!this.params.state) {
      this.params.state = this.generateState();
    }

    let url = `${this.params.AUTORIZATION_URL}?client_id=${encodeURIComponent(this.params.CLIENTE_ID)}`;
    url += `&redirect_uri=${encodeURIComponent(this.params.REDIRECT_URL)}`;
    url += `&response_type=${encodeURIComponent(this.params.RESPONSE_TYPE)}`;
    url += `&scope=${encodeURIComponent(this.params.SCOPE)}`;
    url += `&state_url=${encodeURIComponent(window.location.hash)}`;
    url += `&nonce=${encodeURIComponent(this.params.nonce)}`;
    url += `&state=${encodeURIComponent(this.params.state)}`;

    window.location.replace(url);
    return url;
  }

  public generateState(): string {
    const text = ((Date.now() + Math.random()) * Math.random()).toString().replace('.', '');
    return Md5.hashStr(text);
  }

  public setExpiresAt(): Date | false {
    const expiresAt = localStorage.getItem('expires_at');
    if (!expiresAt || expiresAt === 'Invalid Date') {
      const expiresAtDate = new Date();
      const expires_in = localStorage.getItem('expires_in');
      expiresAtDate.setSeconds(expiresAtDate.getSeconds() + parseInt(expires_in ?? '0', 10));
      localStorage.setItem('expires_at', expiresAtDate.toUTCString());
      return expiresAtDate;
    }
    return new Date(expiresAt);
  }

  public autologout(expires: Date | false): void {
    if (!expires) return;

    const expiresIn = expires.getTime() - Date.now();
    if (expiresIn < this.timeLogoutBefore) {
      this.clearStorage();
      this.logoutSubject.next('logout-auto-only-localstorage');
      return;
    }

    const timerDelay = Math.max(expiresIn - this.timeLogoutBefore, this.timeLogoutBefore);

    if (!isNaN(expiresIn)) {
      of(null).pipe(delay(timerDelay - this.timeLogoutBefore)).subscribe(() => this.logout('logout-auto'));

      if (this.timeAlert < timerDelay) {
        of(null).pipe(delay(timerDelay - this.timeAlert)).subscribe(() => {
          Swal.fire({
            position: 'top-end',
            icon: 'info',
            title: `Su sesión se cerrará en ${this.timeAlert / 60000} minutos`,
            showConfirmButton: false,
            timer: this.timeActiveAlert,
          });
        });
      }
    }
  }

  public getDocument(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      let subscription: Subscription | null = null;

      subscription = this.user$.subscribe({
        next: (data: any) => {
          resolve(data?.userService?.documento ?? null);
          subscription?.unsubscribe();
        },
        error: (error) => {
          reject(error);
          subscription?.unsubscribe();
        }
      });
    });
  }

  public expired(): boolean {
    const expires_at = localStorage.getItem('expires_at');
    return new Date(expires_at ?? new Date().toString()) < new Date();
  }

  public clearStorage(): void {
    localStorage.clear();
  }
}