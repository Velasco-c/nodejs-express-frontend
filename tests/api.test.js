import test from 'node:test';
import assert from 'node:assert/strict';

import { createHttpClient } from '../src/infrastructure/http-client.js';
import { createAuthApi } from '../src/infrastructure/api/auth.api.js';
import { createLibrosApi } from '../src/infrastructure/api/libros.api.js';
import { createUsuariosApi } from '../src/infrastructure/api/usuarios.api.js';
import { createPrestamosApi } from '../src/infrastructure/api/prestamos.api.js';
import { createVentasApi } from '../src/infrastructure/api/ventas.api.js';
import { createInventarioApi } from '../src/infrastructure/api/inventario.api.js';
import { crearFetchFalso, respuestaJson } from './helpers.js';

function crearApis( manejador ){
  const fetchFalso = crearFetchFalso( manejador );
  const http = createHttpClient({ baseUrl: 'https://api.test', fetchImpl: fetchFalso });
  return {
    fetchFalso,
    auth: createAuthApi( http ),
    libros: createLibrosApi( http ),
    usuarios: createUsuariosApi( http ),
    prestamos: createPrestamosApi( http ),
    ventas: createVentasApi( http ),
    inventario: createInventarioApi( http )
  };
}

test( 'auth api envía credenciales y devuelve la sesión', async () => {
  const { auth, fetchFalso } = crearApis( () => respuestaJson({
    token: 'jwt',
    usuario: { identificacion: '1001', nombre: 'Ana' }
  }) );

  const respuesta = await auth.login({ identificacion: ' 1001 ', password: ' clave ' });
  assert.equal( respuesta.token, 'jwt' );
  assert.equal( fetchFalso.llamadas[0].url, 'https://api.test/auth/login' );
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[0].opciones.body ), {
    identificacion: '1001',
    password: ' clave '
  });
});

test( 'libros api lista, busca y codifica códigos', async () => {
  const { libros, fetchFalso } = crearApis( ( { url } ) => {
    if( url.includes( '/buscar' ) ) return respuestaJson( [ { codigo: 'L1' } ], { headers: { 'X-Total-Count': '1' } } );
    if( url.endsWith( '/libros' ) || url.includes( '/libros?' ) ) {
      return respuestaJson( [ { codigo: 'L1' }, { codigo: 'L2' } ], { headers: { 'X-Total-Count': '12' } } );
    }
    return respuestaJson( { codigo: 'L 1/2', titulo: 'T' } );
  });

  const lista = await libros.listar({ pagina: 2, limite: 5 });
  assert.deepEqual( lista, { items: [ { codigo: 'L1' }, { codigo: 'L2' } ], total: 12 } );
  assert.equal( fetchFalso.llamadas[0].url, 'https://api.test/libros?pagina=2&limite=5' );

  const busqueda = await libros.buscar({ q: '  Borges  ', pagina: 1, limite: 10 });
  assert.equal( busqueda.total, 1 );
  assert.equal( fetchFalso.llamadas[1].url, 'https://api.test/libros/buscar?q=Borges&pagina=1&limite=10' );

  const libro = await libros.obtener( 'L 1/2' );
  assert.equal( libro.codigo, 'L 1/2' );
  assert.equal( fetchFalso.llamadas[2].url, 'https://api.test/libros/L%201%2F2' );
});

test( 'libros api crea, actualiza y elimina', async () => {
  const { libros, fetchFalso } = crearApis( () => respuestaJson({ ok: true }) );

  await libros.crear({ codigo: 'L1', titulo: 'T', autor: 'A' });
  assert.equal( fetchFalso.llamadas[0].opciones.method, 'POST' );
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[0].opciones.body ), { codigo: 'L1', titulo: 'T', autor: 'A' } );

  await libros.actualizar( 'L1', { titulo: 'Nuevo' } );
  assert.equal( fetchFalso.llamadas[1].url, 'https://api.test/libros/L1' );
  assert.equal( fetchFalso.llamadas[1].opciones.method, 'PUT' );

  await libros.eliminar( 'L1' );
  assert.equal( fetchFalso.llamadas[2].opciones.method, 'DELETE' );
});

test( 'usuarios api registra, consulta perfil y lista', async () => {
  const { usuarios, fetchFalso } = crearApis( ( { url } ) => {
    if( url.endsWith( '/usuarios' ) || url.includes( '/usuarios?' ) ) {
      return respuestaJson( [ { identificacion: '1001' } ], { headers: { 'X-Total-Count': '11' } } );
    }
    return respuestaJson( { identificacion: '2001', nombre: 'Marta' } );
  });

  await usuarios.registro({
    identificacion: ' 2001 ',
    nombre: ' Marta ',
    telefono: ' 5555 ',
    direccion: ' Zona 9 ',
    email: ' marta@mail.com ',
    password: ' clave con espacios '
  });
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[0].opciones.body ), {
    identificacion: '2001',
    nombre: 'Marta',
    telefono: '5555',
    direccion: 'Zona 9',
    email: 'marta@mail.com',
    password: ' clave con espacios '
  });

  const perfil = await usuarios.perfil();
  assert.equal( perfil.nombre, 'Marta' );
  assert.equal( fetchFalso.llamadas[1].url, 'https://api.test/usuarios/perfil' );

  const lista = await usuarios.listar({ pagina: 1, limite: 3 });
  assert.equal( lista.total, 11 );
  assert.equal( fetchFalso.llamadas[2].url, 'https://api.test/usuarios?pagina=1&limite=3' );

  await usuarios.obtener( 'A/B' );
  assert.equal( fetchFalso.llamadas[3].url, 'https://api.test/usuarios/A%2FB' );
});

test( 'préstamos api registra, devuelve e historial', async () => {
  const { prestamos, fetchFalso } = crearApis( ( { url, opciones } ) => {
    if( opciones.method === 'POST' ) return respuestaJson({ id: 'P001' });
    if( url.includes( '/historial' ) ) return respuestaJson( [], { headers: { 'X-Total-Count': '0' } } );
    return respuestaJson( [], { headers: { 'X-Total-Count': '0' } } );
  });

  await prestamos.registrar({
    codigoLibro: ' L001 ',
    identificacionUsuario: ' 1001 ',
    fechaPrestamo: '',
    fechaTentativaDevolucion: '2026-11-10'
  });
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[0].opciones.body ), {
    codigoLibro: 'L001',
    identificacionUsuario: '1001',
    fechaTentativaDevolucion: '2026-11-10'
  });

  await prestamos.devolver( 'P001', '2026-11-05' );
  assert.equal( fetchFalso.llamadas[1].url, 'https://api.test/prestamos/P001/devolucion' );
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[1].opciones.body ), { fechaDevolucion: '2026-11-05' } );

  const historial = await prestamos.historial({ pagina: 2, limite: 5 });
  assert.deepEqual( historial, { items: [], total: 0 } );
  assert.equal( fetchFalso.llamadas[2].url, 'https://api.test/prestamos/historial?pagina=2&limite=5' );
});

test( 'ventas api registra varias líneas y consulta compras', async () => {
  const { ventas, fetchFalso } = crearApis( ( { url, opciones } ) => {
    if( opciones.method === 'POST' ) return respuestaJson({ id: 'V001', total: 135 });
    if( url.includes( '/mis-compras' ) ) return respuestaJson( [], { headers: { 'X-Total-Count': '0' } } );
    return respuestaJson( [], { headers: { 'X-Total-Count': '0' } } );
  });

  const venta = await ventas.registrar({
    identificacionCliente: ' 1001 ',
    libros: [ { codigo: ' L002 ', cantidad: '3' }, { codigo: 'L001', cantidad: 1 } ]
  });
  assert.equal( venta.id, 'V001' );
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[0].opciones.body ), {
    identificacionCliente: '1001',
    libros: [ { codigo: 'L002', cantidad: 3 }, { codigo: 'L001', cantidad: 1 } ]
  });

  const compras = await ventas.misCompras({ pagina: 1, limite: 5 });
  assert.equal( compras.total, 0 );
  assert.equal( fetchFalso.llamadas[1].url, 'https://api.test/ventas/mis-compras?pagina=1&limite=5' );
});

test( 'ventas api crea, consulta y resuelve pedidos de compra', async () => {
  const { ventas, fetchFalso } = crearApis( () => respuestaJson( { id: 'O001', estado: 'pendiente' }, { headers: { 'X-Total-Count': '1' } } ) );
  await ventas.crearPedido([ { codigo: ' L001 ', cantidad: '2' } ]);
  assert.equal( fetchFalso.llamadas[0].url, 'https://api.test/ventas/pedidos' );
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[0].opciones.body ), { libros: [ { codigo: 'L001', cantidad: 2 } ] } );

  const mios = await ventas.misPedidos({ pagina: 2, limite: 4 });
  assert.equal( mios.total, 1 );
  assert.equal( fetchFalso.llamadas[1].url, 'https://api.test/ventas/pedidos/mis-pedidos?pagina=2&limite=4' );
  await ventas.listarPedidos();
  assert.equal( fetchFalso.llamadas[2].url, 'https://api.test/ventas/pedidos?pagina=1&limite=10' );
  await ventas.resolverPedido( 'O001', 'confirmar' );
  assert.equal( fetchFalso.llamadas[3].url, 'https://api.test/ventas/pedidos/O001/confirmar' );
  assert.equal( fetchFalso.llamadas[3].opciones.method, 'PUT' );
});

test( 'prestamos api crea, lista y resuelve solicitudes', async () => {
  const { prestamos, fetchFalso } = crearApis( () => respuestaJson( { id: 'SP001', estado: 'pendiente' }, { headers: { 'X-Total-Count': '1' } } ) );
  await prestamos.solicitar({ codigoLibro: ' L001 ', fechaTentativaDevolucion: '2099-12-01' });
  assert.deepEqual( JSON.parse( fetchFalso.llamadas[0].opciones.body ), {
    codigoLibro: 'L001', fechaTentativaDevolucion: '2099-12-01'
  });
  assert.equal( fetchFalso.llamadas[0].url, 'https://api.test/prestamos/solicitudes' );

  await prestamos.misSolicitudes();
  assert.equal( fetchFalso.llamadas[1].url, 'https://api.test/prestamos/solicitudes/mis-solicitudes?pagina=1&limite=10' );
  await prestamos.listarSolicitudes();
  assert.equal( fetchFalso.llamadas[2].url, 'https://api.test/prestamos/solicitudes?pagina=1&limite=10' );
  await prestamos.resolverSolicitud( 'SP001', 'aprobar' );
  assert.equal( fetchFalso.llamadas[3].url, 'https://api.test/prestamos/solicitudes/SP001/aprobar' );
});

test( 'inventario api envía el umbral', async () => {
  const { inventario, fetchFalso } = crearApis( () => respuestaJson({ totalTitulos: 51, libros: [] }) );
  const resumen = await inventario.resumen( 5 );
  assert.equal( resumen.totalTitulos, 51 );
  assert.equal( fetchFalso.llamadas[0].url, 'https://api.test/inventario?minimo=5' );
});
