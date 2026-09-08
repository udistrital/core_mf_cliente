import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom, map } from 'rxjs';
import Swal from 'sweetalert2';

interface AuthTransaction {
  state: string;
  nonce: string;
  returnUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ImplicitAutenticationService implements OnDestroy {
  private static readonly AUTH_TRANSACTION_KEY = 'core_auth_transaction';
  private static readonly LOGOUT_STATE_KEY = 'core_logout_state';
  private static readonly AUTH_EVENT_KEY = 'core_auth_event';
  private static readonly LAST_ACTIVITY_KEY = 'core_last_activity';
  private static readonly STORAGE_KEYS = [
    'access_token',
    'apps_menu',
    'apps_menu_context',
    'expires_at',
    'expires_in',
    'id_token',
    'menu',
    'menu_context',
    'notificacion',
    'persona_id',
    'select',
    'state',
    'user',
    'usuario',
    ImplicitAutenticationService.LAST_ACTIVITY_KEY,
  ];
  private static readonly ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
    'click',
    'keydown',
    'mousemove',
    'scroll',
    'touchstart',
  ];

  private readonly idleTimeoutMs = 60 * 60 * 1000;
  private readonly warningBeforeMs = 5 * 60 * 1000;
  private readonly activityThrottleMs = 30 * 1000;
  private environment: any;
  private expirationTimer?: ReturnType<typeof setTimeout>;
  private expirationWarningTimer?: ReturnType<typeof setTimeout>;
  private idleTimer?: ReturnType<typeof setTimeout>;
  private idleWarningTimer?: ReturnType<typeof setTimeout>;
  private lastRecordedActivity = 0;
  private logoutInProgress = false;
  private tokenWarningShown = false;
  private idleWarningShown = false;
  private logoutChannel?: BroadcastChannel;

  private readonly userSubject = new BehaviorSubject<any>({});
  readonly user$ = this.userSubject.asObservable();

  private readonly menuSubject = new BehaviorSubject<any>({});
  readonly menu$ = this.menuSubject.asObservable();

  private readonly logoutSubject = new BehaviorSubject('');
  readonly logout$ = this.logoutSubject.asObservable();

  constructor(private httpClient: HttpClient) {
    window.addEventListener('cerrar-sesion-mf', this.handleCloseSession);
    window.addEventListener('storage', this.handleStorageEvent);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    ImplicitAutenticationService.ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, this.handleActivity, { passive: true })
    );

    if (typeof BroadcastChannel !== 'undefined') {
      this.logoutChannel = new BroadcastChannel('core-auth');
      this.logoutChannel.addEventListener('message', this.handleBroadcastMessage);
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
    window.removeEventListener('cerrar-sesion-mf', this.handleCloseSession);
    window.removeEventListener('storage', this.handleStorageEvent);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    ImplicitAutenticationService.ACTIVITY_EVENTS.forEach((eventName) =>
      window.removeEventListener(eventName, this.handleActivity)
    );
    this.logoutChannel?.removeEventListener('message', this.handleBroadcastMessage);
    this.logoutChannel?.close();
  }

  async init(environment: any): Promise<void> {
    this.environment = environment;
    this.handleLogoutResponse();
    let returnUrl: string | undefined;

    const callbackParams = new URLSearchParams(window.location.hash.slice(1));
    if (callbackParams.has('error')) {
      const description = callbackParams.get('error_description') || callbackParams.get('error');
      this.rejectCallback();
      throw new Error(`WSO2 rechazo la autenticacion: ${description}`);
    }

    if (callbackParams.has('id_token')) {
      returnUrl = await this.processCallback(callbackParams);
    } else {
      const idToken = localStorage.getItem('id_token');
      if (idToken) {
        const payload = this.decodeJwtPayload(idToken);
        if (!this.isValidStoredToken(payload) || this.isSessionExpired(idToken)) {
          this.logout('logout-auto');
          return;
        }
        await this.updateAuth(payload);
      }
    }

    if (localStorage.getItem('id_token')) {
      this.initializeActivity();
      this.scheduleSessionTimers();
      this.scheduleIdleTimers();
    }
    this.clearUrl(returnUrl);
  }

  async updateAuth(payload: any): Promise<void> {
    const cachedUser = this.readStoredUser();
    if (cachedUser && this.isUserCacheCurrent(cachedUser, payload)) {
      this.userSubject.next(cachedUser);
      return;
    }

    try {
      const response = await firstValueFrom(
        this.httpClient.post<any>(
          this.environment.AUTENTICACION_MID,
          { user: payload.email },
          this.getHttpOptions()
        )
      );
      const roles = Array.isArray(response?.role) ? response.role : [];
      const userService = {
        ...response,
        role: Array.from(new Set([...roles, 'ASPIRANTE'])),
      };
      const authenticatedUser = {
        user: payload,
        userService,
        authContext: {
          clientId: this.environment.CLIENTE_ID,
          subject: payload.sub || payload.email,
        },
      };

      localStorage.setItem('user', btoa(JSON.stringify(authenticatedUser)));
      this.userSubject.next(authenticatedUser);
    } catch (error) {
      this.expireLocalSession('logout-auth-error', true);
      throw error;
    }
  }

  login(suppressRedirect: boolean): boolean {
    const idToken = localStorage.getItem('id_token');
    if (!idToken || this.isSessionExpired(idToken)) {
      if (!suppressRedirect) {
        this.getAuthorizationUrl();
      }
      return false;
    }
    return true;
  }

  logout(action: string): void {
    if (this.logoutInProgress) return;
    this.logoutInProgress = true;

    const idToken = localStorage.getItem('id_token');
    const logoutState = this.generateState();
    sessionStorage.removeItem(ImplicitAutenticationService.AUTH_TRANSACTION_KEY);
    sessionStorage.setItem(ImplicitAutenticationService.LOGOUT_STATE_KEY, logoutState);

    this.expireLocalSession(action, true);

    if (idToken && this.environment?.SIGN_OUT_URL) {
      const url = new URL(this.environment.SIGN_OUT_URL);
      url.searchParams.set('id_token_hint', idToken);
      url.searchParams.set('post_logout_redirect_uri', this.environment.SIGN_OUT_REDIRECT_URL);
      url.searchParams.set('state', logoutState);
      window.location.replace(url.toString());
      return;
    }

    this.logoutInProgress = false;
  }

  handleUnauthorized(): void {
    if (localStorage.getItem('id_token')) {
      this.logout('logout-unauthorized');
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  shouldAttachToken(requestUrl: string): boolean {
    if (!this.environment?.AUTENTICACION_MID) return false;
    try {
      const requestOrigin = new URL(requestUrl, window.location.origin).origin;
      const apiOrigin = new URL(this.environment.AUTENTICACION_MID).origin;
      return requestOrigin === apiOrigin;
    } catch {
      return false;
    }
  }

  getPayload(): any {
    const idToken = localStorage.getItem('id_token');
    if (!idToken) return {};
    try {
      return this.decodeJwtPayload(idToken);
    } catch {
      return {};
    }
  }

  getSessionCacheKey(scope = ''): string {
    const payload = this.getPayload();
    const storedUser = this.readStoredUser();
    const roles = Array.isArray(storedUser?.userService?.role)
      ? [...storedUser.userService.role].sort().join(',')
      : '';
    return [payload.sub || payload.email || '', this.environment?.CLIENTE_ID || '', scope, roles].join('|');
  }

  logoutValid(): boolean {
    const returnedState = new URLSearchParams(window.location.search).get('state');
    const expectedState = sessionStorage.getItem(ImplicitAutenticationService.LOGOUT_STATE_KEY);
    if (!returnedState || !expectedState || returnedState !== expectedState) return false;
    sessionStorage.removeItem(ImplicitAutenticationService.LOGOUT_STATE_KEY);
    return true;
  }

  clearUrl(returnUrl?: string): void {
    const safeReturnUrl = returnUrl && returnUrl.startsWith('/') ? returnUrl : window.location.pathname;
    window.history.replaceState({}, document.title, safeReturnUrl);
  }

  getAuthorizationUrl(): string {
    const state = this.generateState();
    const nonce = this.generateState();
    const transaction: AuthTransaction = {
      state,
      nonce,
      returnUrl: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    };
    sessionStorage.setItem(
      ImplicitAutenticationService.AUTH_TRANSACTION_KEY,
      JSON.stringify(transaction)
    );

    const url = new URL(this.environment.AUTORIZATION_URL);
    url.searchParams.set('client_id', this.environment.CLIENTE_ID);
    url.searchParams.set('redirect_uri', this.environment.REDIRECT_URL);
    url.searchParams.set('response_type', this.environment.RESPONSE_TYPE);
    url.searchParams.set('scope', this.environment.SCOPE);
    url.searchParams.set('state_url', window.location.hash);
    url.searchParams.set('nonce', nonce);
    url.searchParams.set('state', state);

    window.location.replace(url.toString());
    return url.toString();
  }

  generateState(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  setExpiresAt(): Date | false {
    const candidates: number[] = [];
    const storedExpiration = Date.parse(localStorage.getItem('expires_at') || '');
    if (Number.isFinite(storedExpiration)) candidates.push(storedExpiration);

    const payload = this.getPayload();
    if (typeof payload.exp === 'number') candidates.push(payload.exp * 1000);
    return candidates.length > 0 ? new Date(Math.min(...candidates)) : false;
  }

  autologout(_expires?: Date | false): void {
    this.scheduleSessionTimers();
  }

  getDocument(): Promise<string | null> {
    return firstValueFrom(
      this.user$.pipe(
        filter((data: any) => Boolean(data?.userService)),
        map((data: any) => data.userService.documento ?? null)
      )
    );
  }

  expired(): boolean {
    const expiresAt = this.setExpiresAt();
    return !expiresAt || expiresAt.getTime() <= Date.now();
  }

  clearStorage(): void {
    ImplicitAutenticationService.STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  private async processCallback(params: URLSearchParams): Promise<string> {
    const transaction = this.readAuthTransaction();
    const returnedState = params.get('state');
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');

    if (!transaction || !returnedState || returnedState !== transaction.state) {
      this.rejectCallback();
      throw new Error('El state retornado por WSO2 no coincide con la autenticacion iniciada');
    }
    if (!idToken || !accessToken) {
      this.rejectCallback();
      throw new Error('WSO2 no retorno los tokens requeridos');
    }

    const payload = this.decodeJwtPayload(idToken);
    if (!this.isValidCallbackToken(payload, transaction.nonce)) {
      this.rejectCallback();
      throw new Error('El ID token retornado por WSO2 no supera las validaciones OIDC');
    }

    this.clearStorage();
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('id_token', idToken);
    localStorage.setItem('state', returnedState);

    const expiresIn = Number(params.get('expires_in'));
    const tokenExpiration = payload.exp * 1000;
    const accessExpiration = Number.isFinite(expiresIn) && expiresIn > 0
      ? Date.now() + expiresIn * 1000
      : tokenExpiration;
    localStorage.setItem(
      'expires_in',
      String(Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : Math.floor((tokenExpiration - Date.now()) / 1000))
    );
    localStorage.setItem('expires_at', new Date(Math.min(accessExpiration, tokenExpiration)).toISOString());
    sessionStorage.removeItem(ImplicitAutenticationService.AUTH_TRANSACTION_KEY);

    await this.updateAuth(payload);
    return transaction.returnUrl;
  }

  private isValidCallbackToken(payload: any, expectedNonce: string): boolean {
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const issuerIsValid = !this.environment.ISSUER || payload.iss === this.environment.ISSUER;
    return Boolean(
      payload &&
      typeof payload.exp === 'number' &&
      payload.exp * 1000 > Date.now() &&
      audience.includes(this.environment.CLIENTE_ID) &&
      payload.nonce === expectedNonce &&
      issuerIsValid
    );
  }

  private isValidStoredToken(payload: any): boolean {
    const audience = Array.isArray(payload?.aud) ? payload.aud : [payload?.aud];
    return Boolean(
      payload &&
      typeof payload.exp === 'number' &&
      audience.includes(this.environment.CLIENTE_ID) &&
      (!this.environment.ISSUER || payload.iss === this.environment.ISSUER)
    );
  }

  private isSessionExpired(idToken: string): boolean {
    try {
      const payload = this.decodeJwtPayload(idToken);
      const expiresAt = this.setExpiresAt();
      return typeof payload.exp !== 'number' || !expiresAt || expiresAt.getTime() <= Date.now();
    } catch {
      return true;
    }
  }

  private decodeJwtPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('JWT invalido');
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  private readAuthTransaction(): AuthTransaction | null {
    try {
      const value = sessionStorage.getItem(ImplicitAutenticationService.AUTH_TRANSACTION_KEY);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  private readStoredUser(): any | null {
    try {
      const value = localStorage.getItem('user');
      return value ? JSON.parse(atob(value)) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  }

  private isUserCacheCurrent(cachedUser: any, payload: any): boolean {
    return cachedUser?.authContext?.clientId === this.environment.CLIENTE_ID &&
      cachedUser?.authContext?.subject === (payload.sub || payload.email) &&
      cachedUser?.userService &&
      cachedUser?.user;
  }

  private getHttpOptions(): { headers: HttpHeaders; observe: 'body' } {
    return {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization: `Bearer ${this.getAccessToken()}`,
      }),
      observe: 'body',
    };
  }

  private initializeActivity(): void {
    const storedActivity = Number(localStorage.getItem(ImplicitAutenticationService.LAST_ACTIVITY_KEY));
    const lastActivity = Number.isFinite(storedActivity) && storedActivity > 0 ? storedActivity : Date.now();
    this.recordActivity(lastActivity);
  }

  private scheduleSessionTimers(): void {
    this.clearSessionTimers();
    const expiresAt = this.setExpiresAt();
    if (!expiresAt) return;

    const remaining = expiresAt.getTime() - Date.now();
    if (remaining <= 0) {
      this.logout('logout-auto');
      return;
    }

    this.expirationTimer = setTimeout(() => this.logout('logout-auto'), remaining);
    if (remaining > this.warningBeforeMs && !this.tokenWarningShown) {
      this.expirationWarningTimer = setTimeout(() => {
        this.tokenWarningShown = true;
        this.showWarning('Su sesion se cerrara en 5 minutos porque el token esta por vencer');
      }, remaining - this.warningBeforeMs);
    }
  }

  private scheduleIdleTimers(): void {
    this.clearIdleTimers();
    const lastActivity = Number(localStorage.getItem(ImplicitAutenticationService.LAST_ACTIVITY_KEY));
    if (!Number.isFinite(lastActivity) || lastActivity <= 0) return;

    const remaining = lastActivity + this.idleTimeoutMs - Date.now();
    if (remaining <= 0) {
      this.logout('logout-inactivity');
      return;
    }

    this.idleTimer = setTimeout(() => this.logout('logout-inactivity'), remaining);
    if (remaining > this.warningBeforeMs && !this.idleWarningShown) {
      this.idleWarningTimer = setTimeout(() => {
        this.idleWarningShown = true;
        this.showWarning('Su sesion se cerrara en 5 minutos por inactividad');
      }, remaining - this.warningBeforeMs);
    }
  }

  private showWarning(message: string): void {
    void Swal.fire({
      position: 'top-end',
      icon: 'info',
      title: message,
      showConfirmButton: false,
      timer: 4000,
    });
  }

  private recordActivity(timestamp: number): void {
    this.lastRecordedActivity = timestamp;
    localStorage.setItem(ImplicitAutenticationService.LAST_ACTIVITY_KEY, String(timestamp));
    this.idleWarningShown = false;
    this.scheduleIdleTimers();
  }

  private expireLocalSession(action: string, broadcast = false): void {
    this.clearTimers();
    this.clearStorage();
    this.userSubject.next({});
    this.logoutSubject.next(action);
    if (broadcast) this.broadcastLogout();
  }

  private rejectCallback(): void {
    sessionStorage.removeItem(ImplicitAutenticationService.AUTH_TRANSACTION_KEY);
    this.expireLocalSession('logout-invalid-callback', true);
    this.clearUrl();
  }

  private handleLogoutResponse(): void {
    if (this.logoutValid()) {
      this.expireLocalSession('logout-complete');
      this.clearUrl();
    }
  }

  private broadcastLogout(): void {
    this.logoutChannel?.postMessage({ type: 'logout' });
    localStorage.setItem(
      ImplicitAutenticationService.AUTH_EVENT_KEY,
      JSON.stringify({ type: 'logout', timestamp: Date.now() })
    );
    localStorage.removeItem(ImplicitAutenticationService.AUTH_EVENT_KEY);
  }

  private clearSessionTimers(): void {
    if (this.expirationTimer) clearTimeout(this.expirationTimer);
    if (this.expirationWarningTimer) clearTimeout(this.expirationWarningTimer);
    this.expirationTimer = undefined;
    this.expirationWarningTimer = undefined;
  }

  private clearIdleTimers(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.idleWarningTimer) clearTimeout(this.idleWarningTimer);
    this.idleTimer = undefined;
    this.idleWarningTimer = undefined;
  }

  private clearTimers(): void {
    this.clearSessionTimers();
    this.clearIdleTimers();
  }

  private readonly handleCloseSession = (): void => this.logout('action-event');

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState !== 'visible' || !localStorage.getItem('id_token')) return;
    if (this.expired()) {
      this.logout('logout-auto');
      return;
    }
    this.scheduleSessionTimers();
    this.scheduleIdleTimers();
  };

  private readonly handleActivity = (): void => {
    if (!localStorage.getItem('id_token')) return;
    const now = Date.now();
    if (now - this.lastRecordedActivity >= this.activityThrottleMs) {
      this.recordActivity(now);
    }
  };

  private readonly handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === ImplicitAutenticationService.LAST_ACTIVITY_KEY && event.newValue) {
      this.lastRecordedActivity = Number(event.newValue);
      this.idleWarningShown = false;
      this.scheduleIdleTimers();
    }
    if (event.key === ImplicitAutenticationService.AUTH_EVENT_KEY && event.newValue) {
      this.expireLocalSession('logout-other-tab');
    }
  };

  private readonly handleBroadcastMessage = (event: MessageEvent): void => {
    if (event.data?.type === 'logout') {
      this.expireLocalSession('logout-other-tab');
    }
  };
}
