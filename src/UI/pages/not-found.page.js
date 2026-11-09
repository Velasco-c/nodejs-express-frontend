import { html } from '../utils/html.js';
import { icon } from '../components/icons.js';
import { homePathForRole } from '../../domain/authorization.js';
import { RUTAS } from '../../domain/constants.js';

export const notFoundPage = {
  render( ctx ){
    const destino = ctx.session ? homePathForRole( ctx.session.role ) : RUTAS.LOGIN;
    const etiqueta = ctx.session ? 'Volver al inicio' : 'Iniciar sesión';

    return html`
      <main class="notfound" id="contenido">
        <div class="notfound-card">
          <span class="notfound-mark" aria-hidden="true">${ icon( 'library', 28 ) }</span>
          <span class="notfound-code">404</span>
          <h1>Esta página se perdió entre los estantes</h1>
          <p>La dirección que buscas no existe o fue movida. Vuelve al inicio para seguir gestionando la librería.</p>
          <a href="${ destino }" data-link class="btn btn-primary btn-lg">
            ${ icon( 'arrow-left', 18 ) } ${ etiqueta }
          </a>
        </div>
        <p class="notfound-brand">Librería · Gestión integral</p>
      </main>
    `;
  }
};
