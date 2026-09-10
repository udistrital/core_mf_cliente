export interface CoreTokenEnvironment {
  AUTORIZATION_URL: string;
  CLIENTE_ID: string;
  RESPONSE_TYPE: string;
  SCOPE: string;
  REDIRECT_URL: string;
  SIGN_OUT_URL: string;
  SIGN_OUT_REDIRECT_URL: string;
  AUTENTICACION_MID: string;
  ISSUER?: string;
}

export interface CoreEnvironment {
  production?: boolean;
  entorno?: 'test' | 'prod';
  autenticacion: boolean;
  notificaciones: boolean;
  menuApps: boolean;
  appname: string;
  appMenu: string;
  navItems?: unknown[];
  TOKEN?: CoreTokenEnvironment;
  [key: string]: unknown;
}

const REQUIRED_TOKEN_FIELDS: (keyof CoreTokenEnvironment)[] = [
  'AUTORIZATION_URL',
  'CLIENTE_ID',
  'RESPONSE_TYPE',
  'SCOPE',
  'REDIRECT_URL',
  'SIGN_OUT_URL',
  'SIGN_OUT_REDIRECT_URL',
  'AUTENTICACION_MID',
];

export function resolveCoreEnvironment(
  defaults: Record<string, unknown>,
  rootEnvironment?: Partial<CoreEnvironment>
): CoreEnvironment {
  const mountedByRoot = rootEnvironment !== undefined;
  const source = rootEnvironment ?? defaults;
  const token = mountedByRoot
    ? rootEnvironment.TOKEN
    : (defaults['TOKEN'] as CoreTokenEnvironment | undefined);

  const resolved: CoreEnvironment = {
    ...defaults,
    ...source,
    autenticacion:
      source['autenticacion'] === undefined
        ? Boolean(token)
        : Boolean(source['autenticacion']),
    notificaciones: Boolean(source['notificaciones']),
    menuApps: Boolean(source['menuApps']),
    appname: String(source['appname'] ?? ''),
    appMenu: String(source['appMenu'] ?? ''),
    TOKEN: token,
  } as CoreEnvironment;

  if (resolved.autenticacion) {
    validateTokenEnvironment(token);
  }

  return resolved;
}

function validateTokenEnvironment(token?: CoreTokenEnvironment): void {
  const missingFields = REQUIRED_TOKEN_FIELDS.filter((field) => {
    const value = token?.[field];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missingFields.length > 0) {
    throw new Error(
      `Configuracion de autenticacion incompleta. Faltan: ${missingFields.join(', ')}`
    );
  }
}
