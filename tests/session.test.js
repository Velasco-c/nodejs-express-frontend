import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createSession,
  decodeJwtPayload,
  hasRole,
  isSessionExpired,
  sessionUser
} from '../src/domain/session.js';
import { createSessionStore } from '../src/infrastructure/session-store.js';
import { SESSION_KEY } from '../src/domain/constants.js';
import { crearAlmacenamiento, crearJwt, sesionValida } from './helpers.js';

const usuario = {
  identificacion: '1001',
  nombre: 'José Pérez',
  telefono: '5555',
  direccion: 'Zona 1',
  email: 'jose@mail.com'
};

test( 'decodeJwtPayload lee payloads base64url con UTF-8', () => {
  const token = crearJwt({
    sub: 7,
    identificacion: '1001',
    role: 'usuario',
    nombre: 'José',
    exp: 2000000000,
    iat: 1900000000
  });

  const payload = decodeJwtPayload( token );
  assert.equal( payload.sub, 7 );
  assert.equal( payload.role, 'usuario' );
  assert.equal( payload.nombre, 'José' );
  assert.equal( decodeJwtPayload( 'no-es-un-jwt' ), null );
  assert.equal( decodeJwtPayload( null ), null );
});

test( 'createSession valida rol, expiración y datos del token', () => {
  const token = crearJwt({
    sub: 7,
    identificacion: '1001',
    role: 'usuario',
    exp: Math.floor( Date.now() / 1000 ) + 3600,
    iat: Math.floor( Date.now() / 1000 )
  });

  const sesion = createSession({ token, usuario });
  assert.equal( sesion.role, 'usuario' );
  assert.equal( sesion.identificacion, '1001' );
  assert.equal( sesion.usuario.nombre, 'José Pérez' );
  assert.ok( sesion.expiresAt > Date.now() );
  assert.equal( Object.isFrozen( sesion ), true );

  assert.throws(
    () => createSession({ token: crearJwt({ sub: 1, role: 'otro', exp: 9999999999 }), usuario }),
    /no es válido/
  );
  assert.throws(
    () => createSession({ token: crearJwt({ role: 'usuario', exp: 9999999999 }), usuario }),
    /no es válido/
  );
  assert.throws(
    () => createSession({ token: crearJwt({ sub: 1, role: 'usuario', exp: 1 }), usuario }),
    /expiró/
  );
});

test( 'helpers de sesión detectan expiración y roles', () => {
  const sesion = sesionValida();
  assert.equal( isSessionExpired( sesion, sesion.expiresAt - 1 ), false );
  assert.equal( isSessionExpired( sesion, sesion.expiresAt + 1 ), true );
  assert.equal( isSessionExpired( null ), true );
  assert.equal( hasRole( sesion, [ 'usuario' ] ), true );
  assert.equal( hasRole( sesion, [ 'admin' ] ), false );
  assert.equal( hasRole( sesion, [] ), true );
  assert.equal( hasRole( null, [ 'admin' ] ), false );
  assert.equal( sessionUser( sesion ).rol, 'usuario' );
  assert.equal( sessionUser( null ), null );
});

test( 'sessionStore guarda, lee y limpia sesiones', () => {
  const storage = crearAlmacenamiento();
  const store = createSessionStore( storage, { now: () => 1000 } );
  const sesion = sesionValida({ expiresAt: 5000 });

  store.save( sesion );
  assert.ok( storage.datos.has( SESSION_KEY ) );
  assert.deepEqual( store.read(), sesion );

  store.clear();
  assert.equal( store.read(), null );
});

test( 'sessionStore descarta sesiones expiradas o corruptas', () => {
  const storage = crearAlmacenamiento({
    inicial: {
      [SESSION_KEY]: JSON.stringify( sesionValida({ expiresAt: 500 } ) )
    }
  });
  const store = createSessionStore( storage, { now: () => 1000 } );
  assert.equal( store.read(), null );
  assert.equal( storage.datos.has( SESSION_KEY ), false );

  storage.datos.set( SESSION_KEY, '{json roto' );
  assert.equal( store.read(), null );

  storage.datos.set( SESSION_KEY, JSON.stringify({ token: 'x' }) );
  assert.equal( store.read(), null );
});

test( 'sessionStore tolera almacenamiento bloqueado', () => {
  const storage = crearAlmacenamiento({ fallaAlLeer: true });
  const store = createSessionStore( storage );
  assert.equal( store.read(), null );

  const sesion = sesionValida();
  assert.doesNotThrow( () => store.save( sesion ) );
  assert.deepEqual( store.read(), sesion );

  assert.doesNotThrow( () => store.clear() );
  assert.equal( store.read(), null );
});
