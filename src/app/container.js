import { config as configPorDefecto } from '../infrastructure/config.js';
import { createHttpClient } from '../infrastructure/http-client.js';
import { createSessionStore } from '../infrastructure/session-store.js';
import { createAuthApi } from '../infrastructure/api/auth.api.js';
import { createLibrosApi } from '../infrastructure/api/libros.api.js';
import { createUsuariosApi } from '../infrastructure/api/usuarios.api.js';
import { createPrestamosApi } from '../infrastructure/api/prestamos.api.js';
import { createVentasApi } from '../infrastructure/api/ventas.api.js';
import { createInventarioApi } from '../infrastructure/api/inventario.api.js';
import { createAuthService } from '../application/auth.service.js';
import { createLibrosService } from '../application/libros.service.js';
import { createUsuariosService } from '../application/usuarios.service.js';
import { createPrestamosService } from '../application/prestamos.service.js';
import { createVentasService } from '../application/ventas.service.js';
import { createInventarioService } from '../application/inventario.service.js';
import { createCarritoService } from '../application/carrito.service.js';
import { configureFormatters } from '../domain/formatters.js';

export function createContainer({
  config = configPorDefecto,
  storage = null,
  fetchImpl = globalThis.fetch,
  onUnauthorized = null
} = {}){
  configureFormatters({ locale: config.locale, currency: config.currency });

  const sessionStore = createSessionStore( storage );

  const http = createHttpClient({
    baseUrl: config.apiBaseUrl,
    fetchImpl,
    timeoutMs: config.requestTimeoutMs,
    getToken: () => sessionStore.read()?.token ?? null,
    onUnauthorized
  });

  const apis = {
    auth: createAuthApi( http ),
    libros: createLibrosApi( http ),
    usuarios: createUsuariosApi( http ),
    prestamos: createPrestamosApi( http ),
    ventas: createVentasApi( http ),
    inventario: createInventarioApi( http )
  };

  const auth = createAuthService( {
    authApi: apis.auth,
    usuariosApi: apis.usuarios,
    sessionStore
  });

  const services = {
    auth,
    libros: createLibrosService({ librosApi: apis.libros }),
    usuarios: createUsuariosService({ usuariosApi: apis.usuarios }),
    prestamos: createPrestamosService({ prestamosApi: apis.prestamos }),
    ventas: createVentasService({ ventasApi: apis.ventas }),
    inventario: createInventarioService({ inventarioApi: apis.inventario }),
    carrito: createCarritoService({
      storage: storage ?? globalThis.localStorage,
      getUserId: () => sessionStore.read()?.usuario?.identificacion ?? 'anonimo'
    })
  };

  return {
    config,
    http,
    apis,
    sessionStore,
    services,
    auth
  };
}
