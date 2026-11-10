import test from 'node:test';
import assert from 'node:assert/strict';

import { createAuthService } from '../src/application/auth.service.js';
import { createLibrosService } from '../src/application/libros.service.js';
import { createPrestamosService } from '../src/application/prestamos.service.js';
import { createVentasService } from '../src/application/ventas.service.js';
import { createInventarioService } from '../src/application/inventario.service.js';
import { createSessionStore } from '../src/infrastructure/session-store.js';
import { ValidationError } from '../src/domain/errors.js';
import { SESSION_KEY } from '../src/domain/constants.js';
import { crearAlmacenamiento, crearJwt } from './helpers.js';

const usuario = {
  identificacion: '1001',
  nombre: 'Ana Pérez',
  telefono: '5555',
  direccion: 'Zona 1',
  email: 'ana@mail.com'
};

function tokenValido( role = 'usuario' ){
  return crearJwt({
    sub: 1,
    identificacion: '1001',
    role,
    exp: Math.floor( Date.now() / 1000 ) + 3600,
    iat: Math.floor( Date.now() / 1000 )
  });
}

function crearAuth( sobre = {} ){
  const almacen = crearAlmacenamiento();
  const llamadas = { login: 0, registro: 0, perfil: 0, actualizar: 0 };
  const authApi = {
    async login( credenciales ){
      llamadas.login += 1;
      llamadas.ultimoLogin = credenciales;
      if( sobre.fallaLogin ) throw new Error( 'credenciales' );
      return { token: sobre.token ?? tokenValido(), usuario: sobre.usuario ?? usuario };
    }
  };
  const usuariosApi = {
    async registro( datos ){
      llamadas.registro += 1;
      llamadas.ultimoRegistro = datos;
      return { ...usuario, ...datos };
    },
    async perfil(){
      llamadas.perfil += 1;
      return sobre.perfil ?? usuario;
    },
    async actualizarPerfil( cambios ){
      llamadas.actualizar += 1;
      llamadas.ultimosCambios = cambios;
      return { ...usuario, ...cambios };
    }
  };
  const sessionStore = createSessionStore( almacen );
  const auth = createAuthService({ authApi, usuariosApi, sessionStore });
  return { auth, sessionStore, almacen, llamadas, authApi, usuariosApi };
}

test( 'auth service inicia sesión, guarda y notifica', async () => {
  const { auth, almacen, llamadas } = crearAuth();
  const notificaciones = [];
  auth.subscribe( sesion => notificaciones.push( sesion ) );

  const sesion = await auth.login({ identificacion: ' 1001 ', password: 'clave' });
  assert.equal( sesion.role, 'usuario' );
  assert.equal( sesion.usuario.nombre, 'Ana Pérez' );
  assert.equal( llamadas.ultimoLogin.identificacion, '1001' );
  assert.equal( llamadas.ultimoLogin.password, 'clave' );
  assert.ok( almacen.datos.has( SESSION_KEY ) );
  assert.equal( auth.isAuthenticated(), true );
  assert.equal( notificaciones.length, 1 );
  assert.equal( notificaciones[0].usuario.nombre, 'Ana Pérez' );
});

test( 'auth service valida credenciales antes de llamar a la API', async () => {
  const { auth, llamadas } = crearAuth();
  await assert.rejects( () => auth.login({ identificacion: '', password: '' }), ValidationError );
  assert.equal( llamadas.login, 0 );
});

test( 'auth service cierra sesión y limpia el almacenamiento', async () => {
  const { auth, almacen } = crearAuth();
  await auth.login({ identificacion: '1001', password: 'clave' });
  const notificaciones = [];
  auth.subscribe( sesion => notificaciones.push( sesion ) );

  auth.logout();
  assert.equal( auth.getSession(), null );
  assert.equal( almacen.datos.has( SESSION_KEY ), false );
  assert.deepEqual( notificaciones, [ null ] );
});

test( 'auth service registra e inicia sesión automáticamente', async () => {
  const { auth, llamadas } = crearAuth();
  const datos = {
    identificacion: '2001',
    nombre: ' Marta ',
    telefono: '5555',
    direccion: 'Zona 9',
    email: 'marta@mail.com',
    password: 'clave-segura'
  };

  const resultado = await auth.registro( datos );
  assert.equal( llamadas.registro, 1 );
  assert.equal( llamadas.ultimoRegistro.nombre, 'Marta' );
  assert.equal( resultado.sesion.role, 'usuario' );
  assert.equal( auth.isAuthenticated(), true );
});

test( 'auth service devuelve sesión nula si el login posterior al registro falla', async () => {
  const { auth } = crearAuth({ fallaLogin: true });
  const resultado = await auth.registro({
    identificacion: '2001',
    nombre: 'Marta',
    telefono: '5555',
    direccion: 'Zona 9',
    email: 'marta@mail.com',
    password: 'clave-segura'
  });
  assert.equal( resultado.sesion, null );
  assert.equal( resultado.usuario.identificacion, '2001' );
});

test( 'auth service actualiza perfil y mantiene el token en la sesión', async () => {
  const { auth, llamadas } = crearAuth();
  const original = await auth.login({ identificacion: '1001', password: 'clave' });

  const { sesion } = await auth.actualizarPerfil({
    nombre: 'Ana María',
    telefono: '5555-9999',
    email: 'nueva@mail.com',
    password: ''
  });

  assert.equal( llamadas.actualizar, 1 );
  assert.deepEqual( llamadas.ultimosCambios, {
    nombre: 'Ana María',
    telefono: '5555-9999',
    email: 'nueva@mail.com'
  });
  assert.equal( sesion.token, original.token );
  assert.equal( sesion.usuario.nombre, 'Ana María' );
  assert.equal( auth.getUser().nombre, 'Ana María' );
});

test( 'auth service carga el perfil y renueva la sesión guardada', async () => {
  const { auth, almacen, llamadas } = crearAuth({
    perfil: { ...usuario, nombre: 'Ana Actualizada' }
  });
  await auth.login({ identificacion: '1001', password: 'clave' });

  const perfil = await auth.cargarPerfil();
  assert.equal( llamadas.perfil, 1 );
  assert.equal( perfil.nombre, 'Ana Actualizada' );

  const guardada = JSON.parse( almacen.datos.get( SESSION_KEY ) );
  assert.equal( guardada.usuario.nombre, 'Ana Actualizada' );
});

test( 'libros service valida y normaliza antes de llamar a la API', async () => {
  const llamadas = [];
  const service = createLibrosService({
    librosApi: {
      listar: async params => { llamadas.push([ 'listar', params ]); return { items: [], total: 0 }; },
      buscar: async params => { llamadas.push([ 'buscar', params ]); return { items: [], total: 0 }; },
      obtener: async codigo => { llamadas.push([ 'obtener', codigo ]); return { codigo }; },
      crear: async datos => { llamadas.push([ 'crear', datos ]); return datos; },
      actualizar: async ( codigo, datos ) => { llamadas.push([ 'actualizar', codigo, datos ]); return datos; },
      eliminar: async codigo => { llamadas.push([ 'eliminar', codigo ]); return {}; }
    }
  });

  await assert.rejects(
    () => service.crear({ codigo: '', titulo: '', autor: '' }),
    ValidationError
  );
  assert.equal( llamadas.length, 0 );

  const creado = await service.crear({
    codigo: ' L1 ',
    titulo: ' Título ',
    autor: ' Autor ',
    isbn: ' 123 ',
    editorial: ' Ed ',
    anio: '1990',
    precio: '12.5',
    stock: '4'
  });
  assert.deepEqual( creado, {
    codigo: 'L1',
    titulo: 'Título',
    autor: 'Autor',
    isbn: '123',
    editorial: 'Ed',
    anio: 1990,
    precio: 12.5,
    stock: 4
  });

  const vacio = await service.buscar({ q: '   ' });
  assert.deepEqual( vacio, { items: [], total: 0 } );
  assert.equal( llamadas.filter( llamada => llamada[0] === 'buscar' ).length, 0 );

  await service.buscar({ q: '  Borges ', pagina: 2, limite: 5 });
  assert.deepEqual( llamadas.at( -1 ), [ 'buscar', { q: 'Borges', pagina: 2, limite: 5, signal: undefined } ] );

  await service.actualizar( 'L1', { titulo: 'Nuevo', autor: 'Autor', anio: '', precio: 10, stock: 2 } );
  assert.deepEqual( llamadas.at( -1 )[2].anio, null );
});

test( 'prestamos service valida datos y propaga operaciones', async () => {
  const llamadas = [];
  const service = createPrestamosService({
    prestamosApi: {
      listar: async p => { llamadas.push([ 'listar', p ]); return { items: [], total: 0 }; },
      registrar: async d => { llamadas.push([ 'registrar', d ]); return { id: 'P001' }; },
      devolver: async ( id, fecha ) => { llamadas.push([ 'devolver', id, fecha ]); return {}; },
      historial: async p => { llamadas.push([ 'historial', p ]); return { items: [], total: 0 }; },
      solicitar: async d => { llamadas.push([ 'solicitar', d ]); return { id: 'SP001' }; },
      listarSolicitudes: async p => { llamadas.push([ 'listarSolicitudes', p ]); return { items: [], total: 0 }; },
      misSolicitudes: async p => { llamadas.push([ 'misSolicitudes', p ]); return { items: [], total: 0 }; },
      resolverSolicitud: async ( id, accion ) => { llamadas.push([ 'resolverSolicitud', id, accion ]); return {}; }
    }
  });

  await assert.rejects( () => service.registrar({ codigoLibro: '' }), ValidationError );
  assert.equal( llamadas.length, 0 );

  await service.registrar({
    codigoLibro: ' L001 ',
    identificacionUsuario: ' 1001 ',
    fechaPrestamo: '',
    fechaTentativaDevolucion: '2026-11-10'
  });
  assert.deepEqual( llamadas.at( -1 )[1], {
    codigoLibro: 'L001',
    identificacionUsuario: '1001',
    fechaPrestamo: '',
    fechaTentativaDevolucion: '2026-11-10'
  });

  await assert.rejects( () => service.devolver( 'P001', '2026-02-30' ), ValidationError );
  await service.devolver( 'P001', '2026-11-05' );
  assert.deepEqual( llamadas.at( -1 ), [ 'devolver', 'P001', '2026-11-05' ] );

  await assert.rejects( () => service.solicitar({ codigoLibro: 'L001', fechaTentativaDevolucion: '2026-02-30' }), ValidationError );
  await service.solicitar({ codigoLibro: ' L001 ', fechaTentativaDevolucion: '2099-12-01' });
  assert.deepEqual( llamadas.at( -1 ), [ 'solicitar', { codigoLibro: 'L001', fechaTentativaDevolucion: '2099-12-01' } ] );
  await service.resolverSolicitud( 'SP001', 'aprobar' );
  assert.deepEqual( llamadas.at( -1 ), [ 'resolverSolicitud', 'SP001', 'aprobar' ] );
});

test( 'ventas service valida, normaliza y delega', async () => {
  const llamadas = [];
  const service = createVentasService({
    ventasApi: {
      listar: async p => { llamadas.push([ 'listar', p ]); return { items: [], total: 0 }; },
      registrar: async d => { llamadas.push([ 'registrar', d ]); return { id: 'V001' }; },
      misCompras: async p => { llamadas.push([ 'misCompras', p ]); return { items: [], total: 0 }; },
      crearPedido: async libros => { llamadas.push([ 'crearPedido', libros ]); return { id: 'O001' }; },
      misPedidos: async p => { llamadas.push([ 'misPedidos', p ]); return { items: [], total: 0 }; },
      listarPedidos: async p => { llamadas.push([ 'listarPedidos', p ]); return { items: [], total: 0 }; },
      resolverPedido: async ( id, accion ) => { llamadas.push([ 'resolverPedido', id, accion ]); return {}; }
    }
  });

  await assert.rejects( () => service.registrar({ identificacionCliente: '', libros: [] }), ValidationError );
  assert.equal( llamadas.length, 0 );

  await service.registrar({
    identificacionCliente: ' 1001 ',
    libros: [ { codigo: ' L1 ', cantidad: '2' } ]
  });
  assert.deepEqual( llamadas.at( -1 )[1], {
    identificacionCliente: '1001',
    libros: [ { codigo: 'L1', cantidad: 2 } ]
  });

  await assert.rejects( () => service.crearPedido({ libros: [] }), ValidationError );
  await service.crearPedido({ libros: [ { codigo: ' L2 ', cantidad: '3' } ] });
  assert.deepEqual( llamadas.at( -1 ), [ 'crearPedido', [ { codigo: 'L2', cantidad: 3 } ] ] );
  await service.resolverPedido( 'O001', 'confirmar' );
  assert.deepEqual( llamadas.at( -1 ), [ 'resolverPedido', 'O001', 'confirmar' ] );
});

test( 'inventario service normaliza el umbral', async () => {
  const llamadas = [];
  const service = createInventarioService({
    inventarioApi: {
      resumen: async ( minimo, opciones ) => {
        llamadas.push([ minimo, opciones ]);
        return { minimo };
      }
    }
  });

  assert.equal( ( await service.resumen( 'abc' ) ).minimo, 2 );
  assert.equal( ( await service.resumen( -1 ) ).minimo, 2 );
  assert.equal( ( await service.resumen( '5' ) ).minimo, 5 );
  assert.equal( ( await service.resumen( 0 ) ).minimo, 0 );
});
