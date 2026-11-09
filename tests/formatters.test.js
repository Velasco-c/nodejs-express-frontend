import test from 'node:test';
import assert from 'node:assert/strict';

import {
  classNames,
  configureFormatters,
  formatCurrency,
  formatDate,
  formatDateShort,
  formatNumber,
  hoyISO,
  initials,
  pluralizar,
  rangoPagina,
  totalPaginas,
  truncate
} from '../src/domain/formatters.js';

test( 'formatCurrency usa opciones regionales y dos decimales', () => {
  assert.equal( formatCurrency( 75, { locale: 'en-US', currency: 'USD' } ), '$75.00' );
  assert.equal( formatCurrency( 1234.5, { locale: 'en-US', currency: 'USD' } ), '$1,234.50' );
  assert.equal( formatCurrency( 'no-numero', { locale: 'en-US', currency: 'USD' } ), '$0.00' );
});

test( 'configureFormatters cambia los valores por defecto', () => {
  configureFormatters({ locale: 'en-US', currency: 'USD' });
  assert.equal( formatCurrency( 10 ), '$10.00' );
  assert.equal( formatNumber( 1200 ), '1,200' );
  configureFormatters({ locale: 'es-GT', currency: 'GTQ' });
});

test( 'formatDate formatea ISO y tolera valores vacíos', () => {
  assert.equal( formatDate( '' ), '—' );
  assert.equal( formatDate( null ), '—' );
  const formateada = formatDate( '2026-11-08', { locale: 'es-GT' } );
  assert.match( formateada, /2026/ );
  assert.match( formateada, /8/ );
  assert.equal( formatDate( 'texto', { locale: 'es-GT' } ), 'texto' );
  assert.match( formatDateShort( '2026-01-05', { locale: 'es-GT' } ), /2026/ );
});

test( 'initials calcula iniciales de nombres', () => {
  assert.equal( initials( 'Ana Pérez' ), 'AP' );
  assert.equal( initials( 'Ana' ), 'AN' );
  assert.equal( initials( '  Ana   María   López  ' ), 'AL' );
  assert.equal( initials( '' ), '?' );
});

test( 'truncate y pluralizar respetan los límites', () => {
  assert.equal( truncate( 'Hola mundo', 20 ), 'Hola mundo' );
  assert.equal( truncate( 'Hola mundo', 6 ), 'Hola…' );
  assert.equal( pluralizar( 1, 'libro', 'libros' ), 'libro' );
  assert.equal( pluralizar( 2, 'libro', 'libros' ), 'libros' );
  assert.equal( classNames( 'a', null, false, 'b', [ 'c' ] ), 'a b c' );
});

test( 'paginación calcula páginas y rangos visibles', () => {
  assert.equal( totalPaginas( 0, 10 ), 1 );
  assert.equal( totalPaginas( 51, 10 ), 6 );
  assert.deepEqual( rangoPagina( 1, 51, 10 ), [ 1, 2, 3, 4, 5 ] );
  assert.deepEqual( rangoPagina( 4, 51, 10 ), [ 2, 3, 4, 5, 6 ] );
  assert.deepEqual( rangoPagina( 6, 51, 10 ), [ 2, 3, 4, 5, 6 ] );
  assert.deepEqual( rangoPagina( 1, 3, 10 ), [ 1 ] );
});

test( 'hoyISO devuelve una fecha ISO', () => {
  assert.match( hoyISO(), /^\d{4}-\d{2}-\d{2}$/ );
});
