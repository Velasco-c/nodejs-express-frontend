import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

import { createFrontendServer } from '../server.js';

const RAIZ = fileURLToPath( new URL( '..', import.meta.url ) );
const silencio = { error() {} };

async function escuchar( servidor ){
  servidor.listen( 0, '127.0.0.1' );
  await new Promise( resolver => servidor.once( 'listening', resolver ) );
  return `http://127.0.0.1:${ servidor.address().port }`;
}

async function cerrar( servidor ){
  if( !servidor.listening ) return;
  await new Promise( resolver => servidor.close( resolver ) );
}

test( 'servidor entrega estáticos, index y fallback de la SPA', async () => {
  const servidor = createFrontendServer({ root: RAIZ, logger: silencio });
  const base = await escuchar( servidor );

  try {
    const inicio = await fetch( `${ base }/` );
    assert.equal( inicio.status, 200 );
    assert.match( inicio.headers.get( 'content-type' ), /text\/html/ );
    assert.match( await inicio.text(), /id="app"/ );

    const modulo = await fetch( `${ base }/src/main.js` );
    assert.equal( modulo.status, 200 );
    assert.match( modulo.headers.get( 'content-type' ), /javascript/ );

    const css = await fetch( `${ base }/src/UI/styles/main.css` );
    assert.equal( css.status, 200 );
    assert.match( css.headers.get( 'content-type' ), /text\/css/ );

    const rutaSpa = await fetch( `${ base }/admin/libros`, { headers: { Accept: 'text/html' } } );
    assert.equal( rutaSpa.status, 200 );
    assert.match( await rutaSpa.text(), /id="app"/ );

    const faltante = await fetch( `${ base }/no-existe.js` );
    assert.equal( faltante.status, 404 );
    assert.deepEqual( await faltante.json(), { error: 'Archivo no encontrado' } );
  }
  finally {
    await cerrar( servidor );
  }
});

test( 'servidor bloquea traversal, métodos no permitidos y HEAD', async () => {
  const servidor = createFrontendServer({ root: RAIZ, logger: silencio });
  const base = await escuchar( servidor );

  try {
    const traversal = await fetch( `${ base }/..%2Fpackage.json` );
    const cuerpo = await traversal.text();
    assert.notEqual( traversal.status, 200 );
    assert.doesNotMatch( cuerpo, /libreria-frontend/ );

    const metodo = await fetch( `${ base }/src/main.js`, { method: 'POST' } );
    assert.equal( metodo.status, 405 );

    const head = await fetch( `${ base }/`, { method: 'HEAD' } );
    assert.equal( head.status, 200 );
    assert.equal( await head.text(), '' );
  }
  finally {
    await cerrar( servidor );
  }
});

test( 'servidor proxifica la API conservando método, token y cabeceras', async () => {
  const recibidas = [];
  const backend = createServer( async ( req, res ) => {
    let cuerpo = '';
    for await ( const trozo of req ) cuerpo += trozo;
    recibidas.push({ url: req.url, method: req.method, headers: req.headers, cuerpo });

    if( req.url.startsWith( '/libros' ) ){
      res.writeHead( 200, { 'Content-Type': 'application/json', 'X-Total-Count': '51' } );
      return res.end( JSON.stringify( [ { codigo: 'L001' } ] ) );
    }

    res.writeHead( 201, { 'Content-Type': 'application/json' } );
    res.end( JSON.stringify({ token: 'jwt', body: cuerpo ? JSON.parse( cuerpo ) : null }) );
  });

  const baseBackend = await escuchar( backend );
  const frontend = createFrontendServer({ root: RAIZ, apiOrigin: baseBackend, logger: silencio });
  const base = await escuchar( frontend );

  try {
    const libros = await fetch( `${ base }/libros?pagina=2`, {
      headers: { Authorization: 'Bearer token-123' }
    });
    assert.equal( libros.status, 200 );
    assert.equal( libros.headers.get( 'x-total-count' ), '51' );
    assert.deepEqual( await libros.json(), [ { codigo: 'L001' } ] );

    assert.equal( recibidas[0].url, '/libros?pagina=2' );
    assert.equal( recibidas[0].headers.authorization, 'Bearer token-123' );

    const login = await fetch( `${ base }/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificacion: 'admin', password: 'clave' })
    });
    assert.equal( login.status, 201 );
    const respuesta = await login.json();
    assert.equal( respuesta.token, 'jwt' );
    assert.deepEqual( respuesta.body, { identificacion: 'admin', password: 'clave' } );
    assert.equal( recibidas[1].method, 'POST' );
  }
  finally {
    await cerrar( frontend );
    await cerrar( backend );
  }
});

test( 'servidor responde 502 cuando la API no está disponible', async () => {
  const frontend = createFrontendServer({
    root: RAIZ,
    apiOrigin: 'http://127.0.0.1:1',
    logger: silencio
  });
  const base = await escuchar( frontend );

  try {
    const respuesta = await fetch( `${ base }/libros` );
    assert.equal( respuesta.status, 502 );
    assert.match( ( await respuesta.json() ).error, /No se pudo conectar con la API/ );
  }
  finally {
    await cerrar( frontend );
  }
});
