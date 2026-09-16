import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { ImplicitAutenticationService } from './implicit_autentication.service';

describe('ImplicitAutenticationService', () => {
  let service: ImplicitAutenticationService;
  let httpTesting: HttpTestingController;

  const environment = {
    AUTENTICACION_MID: 'https://autenticacion.example/api/userRol',
    AUTORIZATION_URL: 'https://autenticacion.example/oauth2/authorize',
    CLIENTE_ID: 'core-client',
    REDIRECT_URL: 'https://core.example/',
    RESPONSE_TYPE: 'id_token token',
    SCOPE: 'openid email role documento',
    SIGN_OUT_REDIRECT_URL: 'https://core.example/',
    SIGN_OUT_URL: 'https://autenticacion.example/oidc/logout',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: TranslateService,
          useValue: {
            get: (key: string | string[]) => of(
              Array.isArray(key)
                ? Object.fromEntries(key.map((translationKey) => [translationKey, translationKey]))
                : key
            ),
          },
        },
      ],
    });
    service = TestBed.inject(ImplicitAutenticationService);
    httpTesting = TestBed.inject(HttpTestingController);
    localStorage.clear();
    sessionStorage.clear();
    (service as any).environment = environment;
  });

  afterEach(() => {
    service.ngOnDestroy();
    httpTesting.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('generates cryptographically sized unique state values', () => {
    const first = service.generateState();
    const second = service.generateState();

    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(second).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(second);
  });

  it('keeps unrelated local storage entries when clearing the session', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('unrelated_preference', 'value');

    service.clearStorage();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('unrelated_preference')).toBe('value');
  });

  it('adds ASPIRANTE once to roles returned by autenticacion_mid', async () => {
    const payload = { sub: 'user-id', email: 'user@example.com' };
    const update = service.updateAuth(payload);
    const request = httpTesting.expectOne(environment.AUTENTICACION_MID);
    expect(request.request.body).toEqual({ user: payload.email });
    request.flush({ role: ['DOCENTE', 'ASPIRANTE'], documento: '123' });

    await update;

    const stored = JSON.parse(atob(localStorage.getItem('user')!));
    expect(stored.userService.role).toEqual(['DOCENTE', 'ASPIRANTE']);
    expect(stored.authContext).toEqual({ clientId: 'core-client', subject: 'user-id' });
  });

  it('uses the earliest expiration between access and ID tokens', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor((Date.now() + 120_000) / 1000) }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    localStorage.setItem('id_token', `header.${payload}.signature`);
    localStorage.setItem('expires_at', new Date(Date.now() + 60_000).toISOString());

    const expiration = service.setExpiresAt();

    expect(expiration).not.toBeFalse();
    expect((expiration as Date).getTime()).toBeLessThanOrEqual(Date.now() + 60_000);
  });

  it('shows the token warning for ten seconds with manual close controls', () => {
    const alert = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

    (service as any).showWarning('auth.session_token_warning', 5 * 60 * 1000);

    expect(alert).toHaveBeenCalledWith(jasmine.objectContaining({
      icon: 'info',
      showCloseButton: true,
      showConfirmButton: false,
      timer: 10 * 1000,
      timerProgressBar: true,
    }));
  });

  it('renews activity when the user confirms the inactivity warning', async () => {
    localStorage.setItem('id_token', 'id-token');
    const recordActivity = spyOn<any>(service, 'recordActivity');
    const alert = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

    (service as any).showWarning('auth.session_idle_warning', 30 * 1000);
    await advanceMicrotasks();

    expect(alert).toHaveBeenCalledWith(jasmine.objectContaining({
      confirmButtonText: 'auth.continue_session',
      icon: 'warning',
      showCloseButton: true,
      showConfirmButton: true,
      timer: 30 * 1000,
      timerProgressBar: true,
    }));
    expect(recordActivity).toHaveBeenCalled();
  });

  it('shows the token warning immediately when already inside the warning period', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor((Date.now() + 60_000) / 1000) }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    localStorage.setItem('id_token', `header.${payload}.signature`);
    localStorage.setItem('expires_at', new Date(Date.now() + 10_000).toISOString());
    const showWarning = spyOn<any>(service, 'showWarning');

    (service as any).scheduleSessionTimers();

    expect(showWarning).toHaveBeenCalledWith(
      'auth.session_token_warning',
      jasmine.any(Number)
    );
  });

  it('shows the inactivity warning immediately when already inside the warning period', () => {
    localStorage.setItem('core_last_activity', String(
      Date.now() - (15 * 60 * 1000 + 20 * 1000)
    ));
    const showWarning = spyOn<any>(service, 'showWarning');

    (service as any).scheduleIdleTimers();

    expect(showWarning).toHaveBeenCalledWith(
      'auth.session_idle_warning',
      jasmine.any(Number)
    );
  });

  it('accepts a callback only when state, nonce and audience match', async () => {
    spyOn<any>(service, 'hasValidAccessTokenHash').and.resolveTo(true);
    const state = 'expected-state';
    const nonce = 'expected-nonce';
    sessionStorage.setItem('core_auth_transaction', JSON.stringify({
      state,
      nonce,
      returnUrl: '/calendario-academico',
    }));
    const idToken = createIdToken({
      aud: environment.CLIENTE_ID,
      at_hash: 'access-token-hash',
      email: 'user@example.com',
      exp: Math.floor((Date.now() + 120_000) / 1000),
      nonce,
      sub: 'user-id',
    });
    const callback = (service as any).processCallback(new URLSearchParams({
      access_token: 'access-token',
      expires_in: '60',
      id_token: idToken,
      state,
    }));
    await advanceMicrotasks();
    httpTesting.expectOne(environment.AUTENTICACION_MID).flush({ role: ['DOCENTE'] });

    await expectAsync(callback).toBeResolvedTo('/calendario-academico');
    expect(localStorage.getItem('access_token')).toBe('access-token');
    expect(sessionStorage.getItem('core_auth_transaction')).toBeNull();
  });

  it('rejects a callback whose state does not match the transaction', async () => {
    sessionStorage.setItem('core_auth_transaction', JSON.stringify({
      state: 'expected-state',
      nonce: 'expected-nonce',
      returnUrl: '/',
    }));
    const callback = (service as any).processCallback(new URLSearchParams({
      access_token: 'access-token',
      id_token: createIdToken({}),
      state: 'different-state',
    }));

    await expectAsync(callback).toBeRejectedWithError(/state retornado/);
    expect(localStorage.getItem('access_token')).toBeNull();
    httpTesting.expectNone(environment.AUTENTICACION_MID);
  });

  it('clears the transaction when WSO2 returns a malformed ID token', async () => {
    sessionStorage.setItem('core_auth_transaction', JSON.stringify({
      state: 'expected-state',
      nonce: 'expected-nonce',
      returnUrl: '/',
    }));

    const callback = (service as any).processCallback(new URLSearchParams({
      access_token: 'access-token',
      id_token: 'malformed-token',
      state: 'expected-state',
    }));

    await expectAsync(callback).toBeRejectedWithError(/ID token malformado/);
    expect(sessionStorage.getItem('core_auth_transaction')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    httpTesting.expectNone(environment.AUTENTICACION_MID);
  });

  it('validates the access token hash from the ID token', async () => {
    await expectAsync(
      (service as any).hasValidAccessTokenHash('access-token', 'Pxa-1wifRlPl7yG_0oJNfw')
    ).toBeResolvedTo(true);
    await expectAsync(
      (service as any).hasValidAccessTokenHash('tampered-token', 'Pxa-1wifRlPl7yG_0oJNfw')
    ).toBeResolvedTo(false);
  });

  it('removes callback tokens from the URL before processing them', async () => {
    let finishCallback!: (returnUrl: string) => void;
    spyOn<any>(service, 'processCallback').and.returnValue(
      new Promise<string>((resolve) => finishCallback = resolve)
    );
    window.history.replaceState({}, '', '/#id_token=sensitive-token');

    const initialization = service.init(environment);

    expect(window.location.hash).toBe('');
    finishCallback('/');
    await initialization;
  });

  it('clears a token from another environment without calling WSO2 logout', async () => {
    localStorage.setItem('id_token', createIdToken({
      aud: 'another-client',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));

    await service.init(environment);

    expect(localStorage.getItem('id_token')).toBeNull();
    expect(sessionStorage.getItem('core_logout_state')).toBeNull();
    httpTesting.expectNone(environment.AUTENTICACION_MID);
  });

  it('does not create logout state when there is no ID token', () => {
    sessionStorage.setItem('core_auth_transaction', 'stale-transaction');
    sessionStorage.setItem('core_logout_state', 'stale-logout-state');
    const generateState = spyOn(service, 'generateState').and.callThrough();

    service.logout('action-event');

    expect(generateState).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('core_auth_transaction')).toBeNull();
    expect(sessionStorage.getItem('core_logout_state')).toBeNull();
    expect((service as any).logoutInProgress).toBeFalse();
  });

  function createIdToken(payload: Record<string, unknown>): string {
    const encodedPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `header.${encodedPayload}.signature`;
  }

  async function advanceMicrotasks(): Promise<void> {
    for (let index = 0; index < 4; index += 1) await Promise.resolve();
  }
});
