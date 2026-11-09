import { html } from './utils/html.js';
import { renderAppLayout, renderAuthLayout, mountAppLayout } from './components/layout.js';
import { loadingScreen, errorState } from './components/ui.js';
import { showToast } from './components/toast.js';
import { getErrorMessage } from '../domain/errors.js';
import { resolveGuard } from '../domain/authorization.js';
import { RUTAS } from '../domain/constants.js';
import { confirmAction } from './components/modal.js';

function rutaActual(){
  return `${ window.location.pathname }${ window.location.search }`;
}

function parsearQuery( search ){
  return Object.fromEntries( new URLSearchParams( search ) );
}

function normalizarDestino( destino ){
  if( typeof destino !== 'string' ) return null;
  if( !destino.startsWith( '/' ) || destino.startsWith( '//' ) ) return null;
  if( destino.startsWith( RUTAS.LOGIN ) || destino.startsWith( RUTAS.REGISTRO ) ) return null;
  return destino;
}

function conRedireccion( ruta, destino ){
  const limpio = normalizarDestino( destino );
  if( !limpio ) return ruta;
  const parametros = new URLSearchParams({ redirect: limpio });
  return `${ ruta }?${ parametros.toString() }`;
}

export function createRouter({ routes, root, services, config, auth }){
  let limpiarLayout = null;
  let limpiarPagina = null;
  let renderToken = 0;
  let iniciado = false;
  let rutaVigente = null;
  let manejadorRetry = null;

  const buscarRuta = pathname => routes.find( ruta => ruta.path === pathname )
    ?? routes.find( ruta => ruta.path === '*' );

  const contexto = ( route, query ) => {
    const sesion = auth.getSession();
    return {
      services,
      config,
      auth,
      session: sesion,
      query,
      route,
      path: window.location.pathname,
      navigate: ( destino, opciones ) => navigate( destino, opciones ),
      refresh: () => render( { conservarScroll: true } ),
      logout: () => salir(),
      toast: showToast,
      confirm: confirmAction
    };
  };

  async function render({ conservarScroll = false } = {}){
    const token = ++renderToken;
    const url = new URL( window.location.href );
    const route = buscarRuta( url.pathname );
    const query = parsearQuery( url.search );
    const sesion = auth.getSession();

    if( typeof route.redirect === 'function' ){
      return navigate( route.redirect( sesion ), { replace: true } );
    }

    const guard = resolveGuard( sesion, route );

    if( guard ){
      const destino = route.roles && !sesion
        ? conRedireccion( RUTAS.LOGIN, `${ url.pathname }${ url.search }` )
        : guard;
      return navigate( destino, { replace: true } );
    }

    limpiarPagina?.();
    limpiarPagina = null;
    limpiarLayout?.();
    limpiarLayout = null;
    manejadorRetry?.();
    manejadorRetry = null;
    rutaVigente = route;
    document.title = `${ route.title ?? 'Librería' } · ${ config.appName }`;

    const ctx = contexto( route, query );

    if( route.layout === 'app' && sesion ){
      root.innerHTML = renderAppLayout({
        session: sesion,
        rutaActual: url.pathname,
        title: route.title ?? config.appName,
        content: loadingScreen()
      }).toString();
      limpiarLayout = mountAppLayout( root, { onLogout: salir } );
    }
    else {
      root.innerHTML = html`
        <div class="boot-screen boot-inline" role="status" aria-live="polite">
          <span class="spinner" aria-hidden="true"></span>
          <span class="boot-text">Cargando…</span>
        </div>
      `.toString();
    }

    let contenido;
    try {
      contenido = await route.page.render( ctx );
    }
    catch( error ){
      contenido = errorState({ message: getErrorMessage( error ) });
    }

    if( token !== renderToken ) return;

    const cuerpo = contenido?.toString ? contenido.toString() : String( contenido ?? '' );

    if( route.layout === 'app' && sesion ){
      root.innerHTML = renderAppLayout({
        session: sesion,
        rutaActual: url.pathname,
        title: route.title ?? config.appName,
        content: contenido
      }).toString();
      limpiarLayout = mountAppLayout( root, { onLogout: salir } );
    }
    else if( route.layout === 'auth' ){
      root.innerHTML = renderAuthLayout({ content: contenido, modo: route.authMode ?? 'login' }).toString();
    }
    else {
      root.innerHTML = cuerpo;
    }

    const retry = root.querySelector( '[data-retry]' );
    if( retry ){
      const alReintentar = () => {
        manejadorRetry?.();
        manejadorRetry = null;
        render();
      };
      retry.addEventListener( 'click', alReintentar );
      manejadorRetry = () => retry.removeEventListener( 'click', alReintentar );
    }

    try {
      const cleanup = route.page.mount?.( root, ctx );
      if( typeof cleanup === 'function' ) limpiarPagina = cleanup;
    }
    catch( error ){
      showToast( getErrorMessage( error ), { type: 'error' } );
    }

    if( !conservarScroll ) window.scrollTo({ top: 0, behavior: 'auto' });
    root.querySelector( '#contenido' )?.focus?.({ preventScroll: true });
  }

  async function navigate( destino, { replace = false } = {} ){
    const url = new URL( destino, window.location.origin );
    const actual = rutaActual();

    if( `${ url.pathname }${ url.search }` === actual ){
      return render( { conservarScroll: true } );
    }

    if( replace ) window.history.replaceState( {}, '', `${ url.pathname }${ url.search }` );
    else window.history.pushState( {}, '', `${ url.pathname }${ url.search }` );

    return render();
  }

  function salir(){
    auth.logout();
    navigate( RUTAS.LOGIN, { replace: true } );
  }

  function manejarClick( evento ){
    if( evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey ) return;

    const enlace = evento.target.closest( 'a[data-link]' );
    if( !enlace ) return;
    if( enlace.target && enlace.target !== '_self' ) return;

    const url = new URL( enlace.href, window.location.origin );
    if( url.origin !== window.location.origin ) return;

    evento.preventDefault();
    navigate( `${ url.pathname }${ url.search }` );
  }

  function start(){
    if( iniciado ) return;
    iniciado = true;
    document.addEventListener( 'click', manejarClick );
    window.addEventListener( 'popstate', () => render() );
    render();
  }

  return {
    start,
    navigate,
    refresh: () => render( { conservarScroll: true } ),
    get route(){ return rutaVigente; },
    logout: salir
  };
}

export { normalizarDestino };
