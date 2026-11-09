import test from 'node:test';
import assert from 'node:assert/strict';

import { createHttpClient } from '../src/infrastructure/http-client.js';
import { ApiError } from '../src/domain/errors.js';
import { crearFetchFalso, respuestaJson } from './helpers.js';

test( 'http client agrega token, query, cuerpo JSON y lee X-Total-Count', async () => {
  const fetchFalso = crearFetchFalso( () => respuestaJson( [ { codigo: 'L001' } ], {
    headers: { 'X-Total-Count': '51' }
  }));

  const client = createHttpClient({
    baseUrl: 'https://api.test',
    fetchImpl: fetchFalso,
    getToken: () => 'token-abc'
  });

  const respuesta = await client.get( '/libros', {
    query: { pagina: 2, limite: 10, vacio: '', nulo: null, omitido: undefined }
  });

  assert.equal( fetchFalso.llamadas.length, 1 );
  const { url, opciones } = fetchFalso.llamadas[0];
  assert.equal( url, 'https://api.test/libros?pagina=2&limite=10' );
  assert.equal( opciones.method, 'GET' );
  assert.equal( opciones.headers.Authorization, 'Bearer token-abc' );
  assert.equal( opciones.headers.Accept, 'application/json' );
  assert.equal( respuesta.status, 200 );
  assert.equal( respuesta.total, 51 );
  assert.deepEqual( respuesta.data, [ { codigo: 'L001' } ] );
});

test( 'http client serializa POST y PUT', async () => {
  const fetchFalso = crearFetchFalso( () => respuestaJson({ ok: true }, { status: 201 }) );
  const client = createHttpClient({ baseUrl: 'https://api.test', fetchImpl: fetchFalso });

  await client.post( '/libros', { codigo: 'L1', titulo: 'T' } );
  const post = fetchFalso.llamadas[0];
  assert.equal( post.opciones.method, 'POST' );
  assert.equal( post.opciones.headers['Content-Type'], 'application/json' );
  assert.deepEqual( JSON.parse( post.opciones.body ), { codigo: 'L1', titulo: 'T' } );

  await client.put( '/libros/L1', { titulo: 'Nuevo' } );
  assert.equal( fetchFalso.llamadas[1].opciones.method, 'PUT' );
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[1].opciones.body ), { titulo: 'Nuevo' } );

  await client.delete( '/libros/L1' );
  assert.equal( fetchFalso.llamadas[2].opciones.method, 'DELETE' );
  assert.equal( fetchFalso.llamadas[2].opciones.body, undefined );
});

test( 'http client transforma errores de la API en ApiError', async () => {
  const fetchFalso = crearFetchFalso( () => respuestaJson({ error: 'Stock insuficiente' }, { status: 409 }) );
  const client = createHttpClient({ baseUrl: 'https://api.test', fetchImpl: fetchFalso });

  await assert.rejects(
    () => client.post( '/ventas', {} ),
    error => {
      assert.equal( error instanceof ApiError, true );
      assert.equal( error.status, 409 );
      assert.equal( error.message, 'Stock insuficiente' );
      assert.deepEqual( error.details, { error: 'Stock insuficiente' } );
      return true;
    }
  );
});

test( 'http client usa mensajes por defecto cuando la API no envía detalle', async () => {
  const fetchFalso = crearFetchFalso( () => new Response( '', { status: 500 } ) );
  const client = createHttpClient({ baseUrl: 'https://api.test', fetchImpl: fetchFalso });

  await assert.rejects(
    () => client.get( '/inventario' ),
    error => error.status === 500 && error.message === 'Error interno del servidor'
  );
});

test( 'http client notifica solo 401 con token y permite omitirlo en login', async () => {
  let notificaciones = 0;
  const fetchFalso = crearFetchFalso( () => respuestaJson({ error: 'Token inválido' }, { status: 401 }) );

  const autenticado = createHttpClient({
    baseUrl: 'https://api.test',
    fetchImpl: fetchFalso,
    getToken: () => 'token',
    onUnauthorized: () => { notificaciones += 1; }
  });
  await assert.rejects( () => autenticado.get( '/libros' ) );
  assert.equal( notificaciones, 1 );

  const anonimo = createHttpClient( {
    baseUrl: 'https://api.test',
    fetchImpl: fetchFalso,
    getToken: () => null,
    onUnauthorized: () => { notificaciones += 1; }
  });
  await assert.rejects( () => anonimo.get( '/libros' ) );
  assert.equal( notificaciones, 1 );

  await assert.rejects(
    () => autenticado.post( '/auth/login', {}, { skipAuthHandler: true } )
  );
  assert.equal( notificaciones, 1 );
});

test( 'http client maneja errores de red y respuestas vacías', async () => {
  const red = createHttpClient({
    baseUrl: 'https://api.test',
    fetchImpl: async () => { throw new TypeError( 'failed to fetch' ); }
  });

  await assert.rejects(
    () => red.get( '/libros' ),
    error => error instanceof ApiError && error.status === 0 && /No se pudo conectar/.test( error.message )
  );

  const vacio = createHttpClient({
    baseUrl: 'https://api.test',
    fetchImpl: async () => new Response( null, { status: 204 } )
  });
  const respuesta = await vacio.delete( '/libros/L1' );
  assert.equal( respuesta.data, null );
  assert.equal( respuesta.total, null );
});

test( 'http client agrega cabecera de autenticación solo si hay token', async () => {
  const fetchFalso = crearFetchFalso( () => respuestaJson({}) );
  const client = createHttpClient({ baseUrl: 'https://api.test', fetchImpl: fetchFalso });
  await client.get( '/healthy' );
  assert.equal( fetchFalso.llamadas[0].opciones.headers.Authorization, undefined );
});
