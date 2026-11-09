import { ROLES } from './constants.js';

const ROLES_VALIDOS = new Set( Object.values( ROLES ) );

function base64UrlADocumento( base64Url ){
  const base64 = String( base64Url ).replace( /-/g, '+' ).replace( /_/g, '/' );
  const padding = ( 4 - ( base64.length % 4 ) ) % 4;
  return `${ base64 }${ '='.repeat( padding ) }`;
}

export function decodeJwtPayload( token ){
  if( typeof token !== 'string' ) return null;
  const partes = token.split( '.' );
  if( partes.length !== 3 ) return null;

  try {
    const binario = atob( base64UrlADocumento( partes[1] ) );
    const bytes = Uint8Array.from( binario, caracter => caracter.charCodeAt( 0 ) );
    const json = new TextDecoder().decode( bytes );
    const payload = JSON.parse( json );
    return payload && typeof payload === 'object' ? payload : null;
  }
  catch {
    return null;
  }
}

export function createSession({ token, usuario, now = Date.now() }){
  const payload = decodeJwtPayload( token );
  if( !payload || !payload.sub || !ROLES_VALIDOS.has( payload.role ) ){
    throw new Error( 'El token de sesión no es válido' );
  }

  const expiraEn = Number.isFinite( Number( payload.exp ) ) ? Number( payload.exp ) * 1000 : null;
  if( expiraEn !== null && expiraEn <= now ) throw new Error( 'La sesión ya expiró' );

  return Object.freeze({
    token,
    usuario: Object.freeze( { ...usuario } ),
    role: payload.role,
    identificacion: payload.identificacion ?? usuario?.identificacion ?? '',
    issuedAt: Number.isFinite( Number( payload.iat ) ) ? Number( payload.iat ) * 1000 : null,
    expiresAt: expiraEn
  });
}

export function isSessionExpired( session, now = Date.now() ){
  return !session || ( session.expiresAt !== null && session.expiresAt <= now );
}

export function sessionUser( session ){
  if( !session ) return null;
  return { ...session.usuario, rol: session.role };
}

export function hasRole( session, roles ){
  if( !session ) return false;
  if( !roles || roles.length === 0 ) return true;
  return roles.includes( session.role );
}
