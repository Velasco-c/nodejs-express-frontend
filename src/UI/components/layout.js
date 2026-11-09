import { html } from '../utils/html.js';
import { avatar } from './ui.js';
import { icon } from './icons.js';
import { ROLES, RUTAS } from '../../domain/constants.js';

const NAV_ADMIN = [
  { ruta: RUTAS.ADMIN, etiqueta: 'Panel', icono: 'dashboard' },
  { ruta: RUTAS.ADMIN_LIBROS, etiqueta: 'Libros', icono: 'book' },
  { ruta: RUTAS.ADMIN_USUARIOS, etiqueta: 'Clientes', icono: 'users' },
  { ruta: RUTAS.ADMIN_PRESTAMOS, etiqueta: 'Préstamos', icono: 'repeat' },
  { ruta: RUTAS.ADMIN_VENTAS, etiqueta: 'Ventas', icono: 'cart' },
  { ruta: RUTAS.ADMIN_INVENTARIO, etiqueta: 'Inventario', icono: 'boxes' }
];

const NAV_CLIENTE = [
  { ruta: RUTAS.CATALOGO, etiqueta: 'Catálogo', icono: 'library' },
  { ruta: RUTAS.MIS_PRESTAMOS, etiqueta: 'Mis préstamos', icono: 'repeat' },
  { ruta: RUTAS.MIS_COMPRAS, etiqueta: 'Mis compras', icono: 'shopping-bag' },
  { ruta: RUTAS.PERFIL, etiqueta: 'Mi perfil', icono: 'user' }
];

const esActiva = ( rutaActual, ruta ) => {
  if( ruta === RUTAS.ADMIN ) return rutaActual === ruta;
  return rutaActual === ruta || rutaActual.startsWith( `${ ruta }/` );
};

export function renderAppLayout({ session, rutaActual, title, content }){
  const esAdmin = session.role === ROLES.ADMIN;
  const navegacion = esAdmin ? NAV_ADMIN : NAV_CLIENTE;
  const usuario = session.usuario ?? {};

  return html`
    <div class="app-shell" data-app-shell>
      <div class="sidebar-overlay" data-nav-close aria-hidden="true"></div>

      <aside class="sidebar" aria-label="Navegación principal">
        <div class="sidebar-brand">
          <span class="brand-mark" aria-hidden="true">${ icon( 'library', 22 ) }</span>
          <div>
            <strong>Librería</strong>
            <span>Gestión integral</span>
          </div>
          <button type="button" class="icon-btn sidebar-close" data-nav-close aria-label="Cerrar menú">
            ${ icon( 'x', 20 ) }
          </button>
        </div>

        <nav class="sidebar-nav">
          <span class="nav-caption">${ esAdmin ? 'Administración' : 'Mi cuenta' }</span>
          ${ navegacion.map( item => html`
            <a href="${ item.ruta }"
               class="nav-item ${ esActiva( rutaActual, item.ruta ) ? 'is-active' : '' }"
               data-link
               ${ esActiva( rutaActual, item.ruta ) ? html`aria-current="page"` : '' }>
              <span class="nav-icon">${ icon( item.icono, 19 ) }</span>
              <span>${ item.etiqueta }</span>
            </a>
          ` ) }
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user">
            ${ avatar( usuario.nombre, 'sm' ) }
            <div class="sidebar-user-copy">
              <strong>${ usuario.nombre ?? 'Usuario' }</strong>
              <span>${ esAdmin ? 'Administrador' : 'Cliente' }</span>
            </div>
          </div>
          <button type="button" class="btn btn-sidebar-logout" data-logout>
            ${ icon( 'logout', 18 ) } <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div class="app-main">
        <header class="topbar">
          <div class="topbar-left">
            <button type="button" class="icon-btn nav-toggle" data-nav-toggle aria-label="Abrir menú">
              ${ icon( 'menu', 22 ) }
            </button>
            <div class="topbar-title">
              <span>${ esAdmin ? 'Panel administrativo' : 'Área de cliente' }</span>
              <strong>${ title }</strong>
            </div>
          </div>
          <div class="topbar-right">
            <span class="session-pill ${ esAdmin ? 'session-admin' : 'session-client' }">
              ${ icon( esAdmin ? 'sparkles' : 'user', 15 ) }
              ${ esAdmin ? 'Administrador' : 'Cliente' }
            </span>
            <div class="topbar-user">
              ${ avatar( usuario.nombre, 'sm' ) }
              <div class="topbar-user-copy">
                <strong>${ usuario.nombre ?? 'Usuario' }</strong>
                <span>${ usuario.identificacion ?? usuario.email ?? '' }</span>
              </div>
            </div>
            <button type="button" class="icon-btn topbar-logout" data-logout aria-label="Cerrar sesión" title="Cerrar sesión">
              ${ icon( 'logout', 19 ) }
            </button>
          </div>
        </header>

        <main id="contenido" class="main-content" tabindex="-1">
          ${ content }
        </main>

        <footer class="app-footer">
          <span>Librería · Gestión de catálogo, préstamos y ventas</span>
          <span>API conectada</span>
        </footer>
      </div>
    </div>
  `;
}

export function mountAppLayout( root, { onLogout } ){
  const cerrarMenu = () => root.querySelector( '[data-app-shell]' )?.classList.remove( 'nav-open' );
  const abrirMenu = () => root.querySelector( '[data-app-shell]' )?.classList.add( 'nav-open' );

  root.addEventListener( 'click', evento => {
    if( evento.target.closest( '[data-nav-toggle]' ) ) abrirMenu();
    if( evento.target.closest( '[data-nav-close]' ) ) cerrarMenu();
    if( evento.target.closest( '[data-logout]' ) ) onLogout?.();
    if( evento.target.closest( 'a[data-link]' ) ) cerrarMenu();
  });

  const cerrarConEscape = evento => {
    if( evento.key === 'Escape' ) cerrarMenu();
  };
  document.addEventListener( 'keydown', cerrarConEscape );

  return () => document.removeEventListener( 'keydown', cerrarConEscape );
}

export function renderAuthLayout({ content, modo = 'login' }){
  return html`
    <div class="auth-shell auth-${ modo }">
      <aside class="auth-brand">
        <div class="auth-brand-top">
          <span class="brand-mark brand-mark-light" aria-hidden="true">${ icon( 'library', 24 ) }</span>
          <span>Librería</span>
        </div>

        <div class="auth-brand-copy">
          <span class="eyebrow eyebrow-light">Gestión integral</span>
          <h1>Historias que se organizan,<br>negocios que crecen.</h1>
          <p>Catálogo, clientes, préstamos, ventas e inventario en un solo lugar.</p>
        </div>

        <div class="auth-shelf" aria-hidden="true">
          <span class="shelf-book shelf-1"></span>
          <span class="shelf-book shelf-2"></span>
          <span class="shelf-book shelf-3"></span>
          <span class="shelf-book shelf-4"></span>
          <span class="shelf-book shelf-5"></span>
          <span class="shelf-book shelf-6"></span>
          <span class="shelf-line"></span>
        </div>

        <div class="auth-quote">
          <span class="quote-mark" aria-hidden="true">“</span>
          <p>Una librería es un lugar donde la imaginación tiene estanterías.</p>
          <span>— Anónimo</span>
        </div>
      </aside>

      <main class="auth-main" id="contenido">
        <div class="auth-mobile-brand">
          <span class="brand-mark" aria-hidden="true">${ icon( 'library', 20 ) }</span>
          <strong>Librería</strong>
        </div>
        <div class="auth-card">${ content }</div>
        <p class="auth-footnote">Sistema de gestión · Catálogo, préstamos, ventas e inventario</p>
      </main>
    </div>
  `;
}
