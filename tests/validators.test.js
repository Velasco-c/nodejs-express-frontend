import test from 'node:test';
import assert from 'node:assert/strict';

import {
  esFechaValida,
  validateBusqueda,
  validateDevolucion,
  validateLibro,
  validateLogin,
  validatePerfil,
  validatePrestamo,
  validateRegistro,
  validateVenta
} from '../src/domain/validators.js';

test( 'login exige identificación y contraseña', () => {
  const resultado = validateLogin({ identificacion: '  ', password: '' });
  assert.equal( resultado.valid, false );
  assert.equal( resultado.errors.identificacion, 'La identificación es obligatoria' );
  assert.equal( resultado.errors.password, 'La contraseña es obligatoria' );
  assert.equal( resultado.firstError, 'La identificación es obligatoria' );

  assert.equal( validateLogin({ identificacion: '1001', password: 'secreta' }).valid, true );
});

test( 'registro valida campos obligatorios, correo y contraseña', () => {
  const incompleto = validateRegistro({ identificacion: '2001' });
  assert.equal( incompleto.valid, false );
  assert.match( incompleto.errors.nombre, /obligatorio/ );
  assert.match( incompleto.errors.direccion, /obligatoria/ );

  const correoMalo = validateRegistro({
    identificacion: '2001',
    nombre: 'Marta',
    telefono: '5555',
    direccion: 'Zona 9',
    email: 'correo-malo',
    password: 'clave-segura'
  });
  assert.equal( correoMalo.errors.email, 'El correo no es válido' );

  const corta = validateRegistro({
    identificacion: '2001',
    nombre: 'Marta',
    telefono: '5555',
    direccion: 'Zona 9',
    email: 'marta@mail.com',
    password: 'corta'
  });
  assert.match( corta.errors.password, /8 y 72/ );

  const valido = validateRegistro({
    identificacion: '2001',
    nombre: 'Marta',
    telefono: '5555',
    direccion: 'Zona 9',
    email: 'marta@mail.com',
    password: 'clave-segura'
  });
  assert.equal( valido.valid, true );
});

test( 'perfil solo valida correo y contraseña cuando se envían', () => {
  assert.equal( validatePerfil({}).valid, true );
  assert.equal( validatePerfil({ email: '' }).valid, true );
  assert.equal( validatePerfil({ email: 'no-es-email' }).valid, false );
  assert.equal( validatePerfil({ password: '1234567' }).valid, false );
  assert.equal( validatePerfil({ password: '12345678' }).valid, true );
});

test( 'libro valida requeridos, año, precio y stock', () => {
  const sinRequeridos = validateLibro({});
  assert.equal( sinRequeridos.errors.codigo, 'El código es obligatorio' );
  assert.equal( sinRequeridos.errors.titulo, 'El título es obligatorio' );
  assert.equal( sinRequeridos.errors.autor, 'El autor es obligatorio' );

  const invalido = validateLibro({
    codigo: 'L1',
    titulo: 'T',
    autor: 'A',
    anio: '1990.5',
    precio: -1,
    stock: 1.2
  });
  assert.match( invalido.errors.anio, /entero/ );
  assert.match( invalido.errors.precio, /mayor o igual a 0/ );
  assert.match( invalido.errors.stock, /entero/ );

  const valido = validateLibro({ codigo: 'L1', titulo: 'T', autor: 'A', anio: '1990', precio: '12.50', stock: '3' });
  assert.equal( valido.valid, true );

  const actualizar = validateLibro({ titulo: 'Nuevo', autor: 'Autor' }, { actualizar: true });
  assert.equal( actualizar.valid, true );
});

test( 'préstamo valida fechas reales y orden cronológico', () => {
  const faltantes = validatePrestamo({});
  assert.match( faltantes.errors.codigoLibro, /obligatorio/ );
  assert.match( faltantes.errors.identificacionUsuario, /obligatoria/ );
  assert.match( faltantes.errors.fechaTentativaDevolucion, /formato/ );

  const inexistente = validatePrestamo({
    codigoLibro: 'L1',
    identificacionUsuario: '1001',
    fechaPrestamo: '2026-02-30',
    fechaTentativaDevolucion: '2026-03-10'
  });
  assert.equal( inexistente.valid, false );

  const anterior = validatePrestamo({
    codigoLibro: 'L1',
    identificacionUsuario: '1001',
    fechaPrestamo: '2026-05-10',
    fechaTentativaDevolucion: '2026-05-09'
  });
  assert.match( anterior.errors.fechaTentativaDevolucion, /anterior/ );

  const valido = validatePrestamo({
    codigoLibro: 'L1',
    identificacionUsuario: '1001',
    fechaPrestamo: '2026-05-10',
    fechaTentativaDevolucion: '2026-05-10'
  });
  assert.equal( valido.valid, true );
});

test( 'devolución acepta fecha vacía y rechaza fechas imposibles', () => {
  assert.equal( validateDevolucion({}).valid, true );
  assert.equal( validateDevolucion({ fechaDevolucion: '2026-13-01' }).valid, false );
  assert.equal( validateDevolucion({ fechaDevolucion: '2026-03-15' }).valid, true );
});

test( 'venta exige cliente, al menos un libro y cantidades positivas', () => {
  const sinLibros = validateVenta({ identificacionCliente: '1001', libros: [] });
  assert.equal( sinLibros.errors.libros, 'Agrega al menos un libro a la venta' );

  const invalida = validateVenta({
    identificacionCliente: '',
    libros: [ { codigo: '', cantidad: 0 }, { codigo: 'L1', cantidad: 1.5 } ]
  });
  assert.match( invalida.errors.identificacionCliente, /obligatoria/ );
  assert.match( invalida.errors['libros.0.codigo'], /fila 1/ );
  assert.match( invalida.errors['libros.0.cantidad'], /fila 1/ );
  assert.match( invalida.errors['libros.1.cantidad'], /fila 2/ );

  const valida = validateVenta({
    identificacionCliente: '1001',
    libros: [ { codigo: 'L1', cantidad: 2 }, { codigo: 'L1', cantidad: 1 } ]
  });
  assert.equal( valida.valid, true );
});

test( 'búsqueda exige texto no vacío y fechas ISO válidas', () => {
  assert.equal( validateBusqueda( '   ' ).valid, false );
  assert.equal( validateBusqueda( 'Borges' ).valid, true );
  assert.equal( esFechaValida( '2024-02-29' ), true );
  assert.equal( esFechaValida( '2023-02-29' ), false );
  assert.equal( esFechaValida( '2024-2-9' ), false );
});
