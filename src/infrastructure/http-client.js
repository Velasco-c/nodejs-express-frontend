import { ApiError } from '../domain/errors.js';

function construirUrl( baseUrl, ruta, query ){
  const rutaLimpia = ruta.startsWith( '/' ) ? ruta : `/${ ruta }`;
  const origen = globalThis.location?.origin ?? 'http://localhost';
  const url = baseUrl
    ? new URL( `${ baseUrl }${ rutaLimpia }`, origen )
    : new URL( rutaLimpia, origen );

  if( query ){
    for( const [ clave, valor ] of Object.entries( query ) ){
      if( valor === undefined || valor === null || valor === '' ) continue;
      if( Array.isArray( valor ) ){
        for( const item of valor ) url.searchParams.append( clave, String( item ) );
      }
      else {
        url.searchParams.set( clave, String( valor ) );
      }
    }
  }

  if( globalThis.location && url.origin === globalThis.location.origin ){
    return `${ url.pathname }${ url.search }`;
  }

  return url.toString();
}

async function leerCuerpo( respuesta ){
  if( respuesta.status === 204 ) return null;

  const tipo = respuesta.headers.get( 'content-type' ) ?? '';
  if( tipo.includes( 'application/json' ) ){
    try {
      return await respuesta.json();
    }
    catch {
      return null;
    }
  }

  const texto = await respuesta.text();
  return texto || null;
}

function mensajeDeError( status, cuerpo ){
  if( cuerpo && typeof cuerpo === 'object' ){
    if( typeof cuerpo.error === 'string' && cuerpo.error.trim() ) return cuerpo.error;
    if( typeof cuerpo.message === 'string' && cuerpo.message.trim() ) return cuerpo.message;
  }

  if( typeof cuerpo === 'string' && cuerpo.trim() ) return cuerpo;

  const mensajes = {
    400: 'Los datos enviados no son válidos',
    401: 'No autorizado',
    403: 'No tienes permisos para esta operación',
    404: 'Recurso no encontrado',
    409: 'La operación entra en conflicto con el estado actual',
    429: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo',
    500: 'Error interno del servidor',
    502: 'No se pudo conectar con la API'
  };

  return mensajes[status] ?? 'No se pudo completar la solicitud';
}

export function createHttpClient({
  baseUrl = '',
  fetchImpl = globalThis.fetch,
  getToken = () => null,
  onUnauthorized = null,
  timeoutMs = 20000
} = {}){
  if( typeof fetchImpl !== 'function' ){
    throw new Error( 'fetch no está disponible en este entorno' );
  }

  async function request( ruta, { method = 'GET', body, query, signal, skipAuthHandler = false } = {} ){
    const token = getToken?.() ?? null;
    const cabeceras = { Accept: 'application/json' };

    if( token ) cabeceras.Authorization = `Bearer ${ token }`;

    let payload = body;
    const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    if( body !== undefined && body !== null && !esFormData ){
      cabeceras['Content-Type'] = 'application/json';
      payload = JSON.stringify( body );
    }

    const controlador = new AbortController();
    const temporizador = setTimeout( () => controlador.abort(), timeoutMs );
    const abortar = () => controlador.abort();

    if( signal ){
      if( signal.aborted ) controlador.abort();
      else signal.addEventListener( 'abort', abortar, { once: true } );
    }

    let respuesta;
    try {
      respuesta = await fetchImpl( construirUrl( baseUrl, ruta, query ), {
        method,
        headers: cabeceras,
        body: payload,
        signal: controlador.signal,
        credentials: 'same-origin'
      });
    }
    catch( error ){
      const abortada = error?.name === 'AbortError';
      throw new ApiError(
        abortada ? 'La solicitud tardó demasiado. Intenta de nuevo.' : 'No se pudo conectar con el servidor. Verifica tu conexión.',
        { status: 0, cause: error }
      );
    }
    finally {
      clearTimeout( temporizador );
      if( signal ) signal.removeEventListener( 'abort', abortar );
    }

    const cuerpo = await leerCuerpo( respuesta );

    if( !respuesta.ok ){
      const error = new ApiError( mensajeDeError( respuesta.status, cuerpo ), {
        status: respuesta.status,
        details: cuerpo
      });

      if( respuesta.status === 401 && token && !skipAuthHandler ){
        onUnauthorized?.( error );
      }

      throw error;
    }

    const totalHeader = respuesta.headers.get( 'x-total-count' );
    const total = totalHeader === null ? null : Number( totalHeader );

    return {
      data: cuerpo,
      total: Number.isFinite( total ) ? total : null,
      status: respuesta.status,
      headers: respuesta.headers
    };
  }

  return {
    request,
    get: ( ruta, opciones = {} ) => request( ruta, { ...opciones, method: 'GET' } ),
    post: ( ruta, body, opciones = {} ) => request( ruta, { ...opciones, method: 'POST', body } ),
    put: ( ruta, body, opciones = {} ) => request( ruta, { ...opciones, method: 'PUT', body } ),
    delete: ( ruta, opciones = {} ) => request( ruta, { ...opciones, method: 'DELETE' } )
  };
}

export { construirUrl };
