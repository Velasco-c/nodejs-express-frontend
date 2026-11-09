import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canAccess,
  homePathForRole,
  resolveGuard
} from '../src/domain/authorization.js';
import { normalizarDestino } from '../src/UI/router.js';
import { RUTAS, ROLES } from '../src/domain/constants.js';

const sesionAdmin = { role: ROLES.ADMIN, usuario: { nombre: 'Admin' } };
const sesionCliente = { role: ROLES.USUARIO, usuario: { nombre: 'Ana' } };

test( 'homePathForRole distingue administrador y cliente', () => {
  assert.equal( homePathForRole( ROLES.ADMIN ), RUTAS.ADMIN );
  assert.equal( homePathForRole( ROLES.USUARIO ), RUTAS.CATALOGO );
  assert.equal( homePathForRole( undefined ), RUTAS.CATALOGO );
});

test( 'canAccess valida roles permitidos', () => {
  assert.equal( canAccess( sesionAdmin, [ ROLES.ADMIN ] ), true );
  assert.equal( canAccess( sesionCliente, [ ROLES.ADMIN ] ), false );
  assert.equal( canAccess( sesionCliente, [ ROLES.ADMIN, ROLES.USUARIO ] ), true );
  assert.equal( canAccess( null, [ ROLES.ADMIN ] ), false );
  assert.equal( canAccess( null, [] ), true );
});

test( 'resolveGuard redirige rutas protegidas sin sesión', () => {
  assert.equal( resolveGuard( null, { roles: [ ROLES.ADMIN ] } ), RUTAS.LOGIN );
  assert.equal( resolveGuard( sesionAdmin, { roles: [ ROLES.ADMIN ] } ), null );
  assert.equal( resolveGuard( sesionCliente, { roles: [ ROLES.ADMIN ] } ), RUTAS.CATALOGO );
});

test( 'resolveGuard impide volver al login con sesión activa', () => {
  assert.equal( resolveGuard( sesionAdmin, { publicOnly: true } ), RUTAS.ADMIN );
  assert.equal( resolveGuard( sesionCliente, { publicOnly: true } ), RUTAS.CATALOGO );
  assert.equal( resolveGuard( null, { publicOnly: true } ), null );
  assert.equal( resolveGuard( null, {} ), null );
});

test( 'normalizarDestino acepta solo rutas internas seguras', () => {
  assert.equal( normalizarDestino( '/admin/libros?pagina=2' ), '/admin/libros?pagina=2' );
  assert.equal( normalizarDestino( 'https://malicioso.test' ), null );
  assert.equal( normalizarDestino( '//malicioso.test' ), null );
  assert.equal( normalizarDestino( '/login' ), null );
  assert.equal( normalizarDestino( '/registro?x=1' ), null );
  assert.equal( normalizarDestino( 123 ), null );
  assert.equal( normalizarDestino( null ), null );
});
