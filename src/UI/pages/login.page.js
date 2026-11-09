import { html } from '../utils/html.js';
import { field } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { mostrarErroresFormulario, bloquearBoton, datosFormulario } from '../utils/dom.js';
import { ValidationError, getErrorMessage } from '../../domain/errors.js';
import { getErrorMessage as mensajeError } from '../../domain/errors.js';
import { homePathForRole } from '../../domain/authorization.js';
import { normalizarDestino } from '../router.js';
import { CREDENCIALES_DEMO, DEMO_PASSWORD, RUTAS } from '../../domain/constants.js';

function destinoSeguro( ctx ){
  const solicitado = normalizarDestino( ctx.query.redirect );
  if( solicitado ) return solicitado;
  return homePathForRole( ctx.session?.role );
}

export const loginPage = {
  render( ctx ){
    const valorIdentificacion = ctx.query.identificacion ?? '';
    const destinoRegistro = ctx.query.redirect
      ? `${ RUTAS.REGISTRO }?redirect=${ encodeURIComponent( ctx.query.redirect ) }`
      : RUTAS.REGISTRO;

    return html`
      <div class="auth-form-head">
        <span class="eyebrow">Bienvenido de nuevo</span>
        <h2>Inicia sesión</h2>
        <p>Accede al panel de gestión de tu librería.</p>
      </div>

      <form class="auth-form" data-login-form novalidate>
        ${ field({
          label: 'Identificación',
          name: 'identificacion',
          value: valorIdentificacion,
          placeholder: 'admin o 1001',
          required: true,
          autocomplete: 'username',
          autofocus: true
        }) }
        ${ field({
          label: 'Contraseña',
          name: 'password',
          type: 'password',
          placeholder: 'Tu contraseña',
          required: true,
          autocomplete: 'current-password'
        }) }

        <p class="form-alert" data-form-error role="alert" hidden></p>

        <button type="submit" class="btn btn-primary btn-block btn-lg" data-submit>
          ${ icon( 'arrow-right', 18 ) } Entrar
        </button>
      </form>

      <div class="demo-box">
        <div class="demo-title">
          ${ icon( 'key', 16 ) }
          <span>Credenciales de demostración</span>
        </div>
        <div class="demo-options">
          ${ CREDENCIALES_DEMO.map( demo => html`
            <button type="button" class="demo-chip" data-demo-user="${ demo.identificacion }">
              <strong>${ demo.etiqueta }</strong>
              <span>${ demo.identificacion }</span>
            </button>
          ` ) }
        </div>
        <p class="demo-password">Contraseña: <code>${ DEMO_PASSWORD }</code></p>
      </div>

      <p class="auth-switch">
        ¿Aún no tienes cuenta?
        <a href="${ destinoRegistro }" data-link>Crear una cuenta</a>
      </p>
    `;
  },

  mount( root, ctx ){
    const formulario = root.querySelector( '[data-login-form]' );
    if( !formulario ) return;

    if( ctx.query.expirada ){
      ctx.toast( 'Tu sesión expiró. Vuelve a iniciar sesión.', { type: 'warning', title: 'Sesión finalizada' } );
    }

    const errorBox = formulario.querySelector( '[data-form-error]' );
    const boton = formulario.querySelector( '[data-submit]' );

    for( const chip of root.querySelectorAll( '[data-demo-user]' ) ){
      chip.addEventListener( 'click', () => {
        formulario.elements.identificacion.value = chip.dataset.demoUser;
        formulario.elements.password.value = DEMO_PASSWORD;
        formulario.elements.identificacion.focus();
        errorBox.hidden = true;
      });
    }

    formulario.addEventListener( 'submit', async evento => {
      evento.preventDefault();
      errorBox.hidden = true;
      const datos = datosFormulario( formulario );
      bloquearBoton( boton, true, 'Ingresando…' );

      try {
        const sesion = await ctx.auth.login( datos );
        ctx.toast( `Bienvenido, ${ sesion.usuario.nombre ?? sesion.identificacion }.`, {
          type: 'success',
          title: 'Sesión iniciada'
        } );
        await ctx.navigate( destinoSeguro( ctx ) );
      }
      catch( error ){
        if( error instanceof ValidationError ){
          mostrarErroresFormulario( formulario, error.errors );
        }
        else {
          errorBox.textContent = mensajeError( error );
          errorBox.hidden = false;
        }
        ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo iniciar sesión' } );
      }
      finally {
        bloquearBoton( boton, false );
      }
    });
  }
};
