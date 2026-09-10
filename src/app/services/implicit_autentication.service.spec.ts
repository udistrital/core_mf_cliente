import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
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
          useValue: { get: (key: string) => of(key) },
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

  it('accepts a callback only when state, nonce and audience match', async () => {
    const state = 'expected-state';
    const nonce = 'expected-nonce';
    sessionStorage.setItem('core_auth_transaction', JSON.stringify({
      state,
      nonce,
      returnUrl: '/calendario-academico',
    }));
    const idToken = createIdToken({
      aud: environment.CLIENTE_ID,
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
});
