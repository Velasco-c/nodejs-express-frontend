/**
 * Errores de dominio e infraestructura.
 * La capa de presentación solo necesita `getErrorMessage`.
 */

export class ApiError extends Error {
  constructor( message, { status = 0, details = null, cause = null } = {} ){
    super( message );
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    if( cause ) this.cause = cause;
  }
}

export class ValidationError extends Error {
  constructor( errors, message = null ){
    const first = message ?? Object.values( errors )[0] ?? 'Datos inválidos';
    super( first );
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class ConfigurationError extends Error {
  constructor( message ){
    super( message );
    this.name = 'ConfigurationError';
  }
}

export function getErrorMessage( error, fallback = 'Ocurrió un error inesperado' ){
  if( error instanceof ApiError ){
    if( error.status === 0 ) return error.message || 'No se pudo conectar con el servidor';
    return error.message || fallback;
  }

  if( error instanceof ValidationError ) return error.message || fallback;
  if( error instanceof Error && error.message ) return error.message;
  return fallback;
}

export function isUnauthorized( error ){
  return error instanceof ApiError && error.status === 401;
}
