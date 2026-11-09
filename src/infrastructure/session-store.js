import { SESSION_KEY } from '../domain/constants.js';
import { isSessionExpired } from '../domain/session.js';

function almacenamientoEnMemoria(){
  const datos = new Map();
  return {
    getItem: clave => datos.get( clave ) ?? null,
    setItem: ( clave, valor ) => datos.set( clave, String( valor ) ),
    removeItem: clave => datos.delete( clave )
  };
}

/**
 * Envuelve un almacenamiento para que la aplicación siga funcionando aunque
 * el navegador lo bloquee (modo privado, cuota, políticas de cookies).
 * La escritura se refleja siempre en memoria y la lectura recurre a ella
 * cuando el almacenamiento real falla.
 */
function conRespaldoEnMemoria( almacen ){
  const respaldo = almacenamientoEnMemoria();

  return {
    getItem( clave ){
      try {
        const valor = almacen.getItem( clave );
        return valor ?? respaldo.getItem( clave );
      }
      catch {
        return respaldo.getItem( clave );
      }
    },
    setItem( clave, valor ){
      respaldo.setItem( clave, valor );
      try {
        almacen.setItem( clave, valor );
      }
      catch {
        // Se conserva la copia en memoria durante la sesión.
      }
    },
    removeItem( clave ){
      respaldo.removeItem( clave );
      try {
        almacen.removeItem( clave );
      }
      catch {
        // Nada que hacer.
      }
    }
  };
}

function obtenerAlmacenamiento( storage ){
  if( storage ) return conRespaldoEnMemoria( storage );
  try {
    if( globalThis.localStorage ){
      const prueba = '__libreria_test__';
      globalThis.localStorage.setItem( prueba, '1' );
      globalThis.localStorage.removeItem( prueba );
      return conRespaldoEnMemoria( globalThis.localStorage );
    }
  }
  catch {
    // Almacenamiento bloqueado: se usa memoria durante la sesión.
  }
  return almacenamientoEnMemoria();
}

export function createSessionStore( storage = null, { key = SESSION_KEY, now = () => Date.now() } = {} ){
  const almacen = obtenerAlmacenamiento( storage );

  function clear(){
    try {
      almacen.removeItem( key );
    }
    catch {
      // Nada que hacer.
    }
  }

  function read(){
    let crudo;
    try {
      crudo = almacen.getItem( key );
    }
    catch {
      return null;
    }

    if( !crudo ) return null;

    try {
      const sesion = JSON.parse( crudo );
      if( !sesion || typeof sesion.token !== 'string' || !sesion.usuario || !sesion.role ){
        clear();
        return null;
      }
      if( isSessionExpired( sesion, now() ) ){
        clear();
        return null;
      }
      return sesion;
    }
    catch {
      clear();
      return null;
    }
  }

  function save( sesion ){
    if( !sesion?.token ) throw new Error( 'No se puede guardar una sesión sin token' );
    almacen.setItem( key, JSON.stringify( sesion ) );
    return sesion;
  }

  return { read, save, clear, key };
}
