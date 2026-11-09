import { createContainer } from './app/container.js';
import { createRouter } from './UI/router.js';
import { routes } from './UI/routes.js';
import { showToast } from './UI/components/toast.js';
import { RUTAS } from './domain/constants.js';

const root = document.getElementById( 'app' );

if( !root ){
  throw new Error( 'No se encontró el contenedor principal de la aplicación' );
}

let router;
let manejandoExpiracion = false;

const container = createContainer({
  onUnauthorized(){
    if( manejandoExpiracion ) return;
    manejandoExpiracion = true;

    const rutaActual = `${ window.location.pathname }${ window.location.search }`;
    container.auth.logout();
    showToast( 'Tu sesión expiró. Vuelve a iniciar sesión para continuar.', {
      type: 'warning',
      title: 'Sesión finalizada'
    });

    const destino = window.location.pathname === RUTAS.LOGIN
      ? RUTAS.LOGIN
      : `${ RUTAS.LOGIN }?expirada=1&redirect=${ encodeURIComponent( rutaActual ) }`;

    router?.navigate( destino, { replace: true } );
    setTimeout( () => {
      manejandoExpiracion = false;
    }, 500 );
  }
});

router = createRouter({
  routes,
  root,
  services: container.services,
  config: container.config,
  auth: container.auth
});

router.start();

window.addEventListener( 'unhandledrejection', evento => {
  if( evento.reason?.name === 'ApiError' || evento.reason?.name === 'ValidationError' ) return;
  console.error( 'Error no controlado:', evento.reason );
});

export { container, router };
