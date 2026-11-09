import { ROLES, RUTAS } from './constants.js';
import { hasRole } from './session.js';

export function homePathForRole( role ){
  return role === ROLES.ADMIN ? RUTAS.ADMIN : RUTAS.CATALOGO;
}

export function canAccess( session, roles ){
  if( !roles || roles.length === 0 ) return true;
  return hasRole( session, roles );
}

/**
 * Decide a dónde ir cuando se intenta abrir una ruta.
 * Devuelve null si la navegación es válida.
 */
export function resolveGuard( session, route ){
  const autenticado = Boolean( session );

  if( route.publicOnly && autenticado ){
    return homePathForRole( session.role );
  }

  if( route.roles && !autenticado ){
    return RUTAS.LOGIN;
  }

  if( route.roles && !canAccess( session, route.roles ) ){
    return homePathForRole( session.role );
  }

  return null;
}
