import test from 'node:test';
import assert from 'node:assert/strict';

import { escapeHtml, html, raw } from '../src/UI/utils/html.js';
import { loginPage } from '../src/UI/pages/login.page.js';
import { librosPage } from '../src/UI/pages/libros.page.js';
import { catalogoPage } from '../src/UI/pages/catalogo.page.js';
import { historialPage } from '../src/UI/pages/historial.page.js';
import { misComprasPage } from '../src/UI/pages/mis-compras.page.js';
import { notFoundPage } from '../src/UI/pages/not-found.page.js';
import { renderAppLayout } from '../src/UI/components/layout.js';
import { pagination } from '../src/UI/components/ui.js';

const renderizar = valor => valor.toString();

test( 'la plantilla html escapa datos y respeta fragmentos seguros', () => {
  const malicioso = '<img src=x onerror="alert(1)">';
  const salida = renderizar( html`<p>${ malicioso }</p>` );
  assert.equal( salida, '<p>&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>' );
  assert.equal( escapeHtml( `&<>"'` ), '&amp;&lt;&gt;&quot;&#39;' );

  const fragmento = renderizar( html`<div>${ raw( '<strong>Seguro</strong>' ) } ${ [ 'a', '<b>' ] } ${ null } ${ false }</div>` );
  assert.equal( fragmento, '<div><strong>Seguro</strong> a&lt;b&gt;  </div>' );
});

test( 'login muestra formulario, credenciales demo y destino de registro', () => {
  const salida = renderizar( loginPage.render({ query: { redirect: '/admin/libros' } }) );
  assert.match( salida, /name="identificacion"/ );
  assert.match( salida, /name="password"/ );
  assert.match( salida, /data-demo-user="admin"/ );
  assert.match( salida, /data-demo-user="1001"/ );
  assert.match( salida, /Libreria2026/ );
  assert.match( salida, /href="\/registro\?redirect=%2Fadmin%2Flibros"/ );
});

test( 'libros renderiza tabla y escapa títulos maliciosos', async () => {
  const ctx = {
    config: { pageSize: 10 },
    query: {},
    services: {
      libros: {
        async listar(){ return { total: 1, items: [ {
          codigo: 'L001',
          titulo: '<img src=x onerror=alert(1)>',
          autor: 'Autor & Cía',
          isbn: '123',
          anio: 1967,
          editorial: 'Editorial',
          precio: 75,
          stock: 3
        } ] }; },
        async buscar(){ throw new Error( 'no debería buscar' ); }
      }
    }
  };

  const salida = renderizar( await librosPage.render( ctx ) );
  assert.match( salida, /&lt;img src=x onerror=alert\(1\)&gt;/ );
  assert.doesNotMatch( salida, /<img src=x/ );
  assert.match( salida, /Autor &amp; Cía/ );
  assert.match( salida, /L001/ );
  assert.match( salida, /data-edit-book="L001"/ );
  assert.match( salida, /data-delete-book="L001"/ );
  assert.match( salida, /3 ejemplares/ );
});

test( 'libros usa búsqueda y muestra estado vacío', async () => {
  let parametros;
  const ctx = {
    config: { pageSize: 10 },
    query: { q: 'inexistente' },
    services: {
      libros: {
        async listar(){ throw new Error( 'no debería listar' ); },
        async buscar( p ){ parametros = p; return { total: 0, items: [] }; }
      }
    }
  };

  const salida = renderizar( await librosPage.render( ctx ) );
  assert.deepEqual( parametros, { q: 'inexistente', pagina: 1, limite: 10 } );
  assert.match( salida, /Sin coincidencias/ );
  assert.match( salida, /inexistente/ );
  assert.match( salida, /Limpiar búsqueda/ );
});

test( 'catálogo renderiza tarjetas y estado de stock', async () => {
  const ctx = {
    config: { catalogPageSize: 12 },
    query: {},
    services: {
      libros: {
        async listar(){ return { total: 2, items: [
          { codigo: 'L001', titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', anio: 1967, editorial: 'Sudamericana', precio: 75, stock: 3 },
          { codigo: 'L009', titulo: 'Pedro Páramo', autor: 'Juan Rulfo', anio: 1955, editorial: 'FCE', precio: 90, stock: 0 }
        ] }; },
        async buscar(){ throw new Error( 'no debería buscar' ); }
      }
    }
  };

  const salida = renderizar( await catalogoPage.render( ctx ) );
  assert.match( salida, /Cien años de soledad/ );
  assert.match( salida, /Gabriel García Márquez/ );
  assert.match( salida, /Pedro Páramo/ );
  assert.match( salida, /Agotado/ );
  assert.match( salida, /data-book-code="L001"/ );
  assert.match( salida, /Q75\.00|75\.00/ );
});

test( 'historial y compras muestran estados y totales', async () => {
  const ctxHistorial = {
    config: { pageSize: 10 },
    query: {},
    services: { prestamos: { async historial(){ return { total: 2, items: [
      { id: 'P001', codigoLibro: 'L001', fechaPrestamo: '2026-11-01', fechaTentativaDevolucion: '2026-11-10', fechaDevolucion: '2026-11-05' },
      { id: 'P002', codigoLibro: 'L002', fechaPrestamo: '2026-11-02', fechaTentativaDevolucion: '2099-12-31', fechaDevolucion: null }
    ] }; } } }
  };
  const historial = renderizar( await historialPage.render( ctxHistorial ) );
  assert.match( historial, /P001/ );
  assert.match( historial, /Devuelto/ );
  assert.match( historial, /Activo/ );

  const ctxCompras = {
    config: { pageSize: 10 },
    query: {},
    services: { ventas: { async misCompras(){ return { total: 1, items: [ {
      id: 'V001',
      fecha: '2026-11-05',
      total: 135,
      items: [ { codigo: 'L002', titulo: 'El principito', cantidad: 3, precioUnitario: 45, subtotal: 135 } ]
    } ] }; } } }
  };
  const compras = renderizar( await misComprasPage.render( ctxCompras ) );
  assert.match( compras, /V001/ );
  assert.match( compras, /El principito/ );
  assert.match( compras, /135/ );
});

test( 'layout administrativo y de cliente muestran navegación correcta', () => {
  const admin = renderizar( renderAppLayout({
    session: { role: 'admin', usuario: { nombre: 'Administrador', identificacion: 'admin' } },
    rutaActual: '/admin/libros',
    title: 'Libros',
    content: html`<p>Contenido</p>`
  }) );
  assert.match( admin, /href="\/admin\/libros"/ );
  assert.match( admin, /href="\/admin\/inventario"/ );
  assert.doesNotMatch( admin, /href="\/catalogo"/ );
  assert.match( admin, /Administrador/ );
  assert.match( admin, /data-logout/ );

  const cliente = renderizar( renderAppLayout({
    session: { role: 'usuario', usuario: { nombre: 'Ana Pérez', identificacion: '1001' } },
    rutaActual: '/catalogo',
    title: 'Catálogo',
    content: html`<p>Contenido</p>`
  }) );
  assert.match( cliente, /href="\/catalogo"/ );
  assert.match( cliente, /href="\/mis-prestamos"/ );
  assert.match( cliente, /href="\/perfil"/ );
  assert.doesNotMatch( cliente, /href="\/admin\/libros"/ );
  assert.match( cliente, /Ana Pérez/ );
  assert.match( cliente, /Cliente/ );
});

test( 'paginación incluye resumen, página actual y conserva filtros', () => {
  const salida = renderizar( pagination({
    total: 51,
    pagina: 1,
    limite: 10,
    basePath: '/admin/libros',
    query: { q: 'Borges' }
  }) );

  assert.match( salida, /Mostrando/ );
  assert.match( salida, /1–10/ );
  assert.match( salida, /de <strong>51<\/strong>/ );
  assert.match( salida, /href="\/admin\/libros\?q=Borges&amp;pagina=2"/ );
  assert.match( salida, /aria-current="page"/ );
  assert.equal( renderizar( pagination({ total: 0, pagina: 1, limite: 10, basePath: '/x' }) ), '' );
});

test( 'la página 404 enlaza al inicio según la sesión', () => {
  const admin = renderizar( notFoundPage.render({ session: { role: 'admin' } }) );
  assert.match( admin, /404/ );
  assert.match( admin, /href="\/admin"/ );

  const anonimo = renderizar( notFoundPage.render({ session: null }) );
  assert.match( anonimo, /href="\/login"/ );
});
