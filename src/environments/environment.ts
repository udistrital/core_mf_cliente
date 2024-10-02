export const environment = {
  production: false,
  assets: 'https://pruebasassets.portaloas.udistrital.edu.co/',
  CONFIGURACION_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/configuracion_crud_api/v1/',

  // Notificaciones
  NOTIFICACION_MID_WS: "ws://autenticacion.portaloas.udistrital.edu.co/apioas/notificacion_mid/v1/ws",
  NOTIFICACIONES_CRUD: "https://autenticacion.portaloas.udistrital.edu.co/apioas/notificaciones_crud/",
  
  TOKEN: {
    AUTORIZATION_URL: 'https://autenticacion.portaloas.udistrital.edu.co/oauth2/authorize',
    CLIENTE_ID: 'e36v1MPQk2jbz9KM4SmKhk8Cyw0a',
    RESPONSE_TYPE: 'id_token token',
    SCOPE: 'openid email role documento',
    REDIRECT_URL: 'http://localhost:4200/',
    SIGN_OUT_URL: 'https://autenticacion.portaloas.udistrital.edu.co/oidc/logout',
    SIGN_OUT_REDIRECT_URL: 'http://localhost:4200/',
    AUTENTICACION_MID: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/autenticacion_mid/v1/token/userRol',
  },
  TERCEROS_SERVICE: 'https://autenticacion.portaloas.udistrital.edu.co/apioas/terceros_crud/v1/',
  apiUrl: 'https://pruebascoreclientes.portaloas.udistrital.edu.co/',
};
