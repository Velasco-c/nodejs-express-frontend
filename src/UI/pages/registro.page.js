import { html } from '../utils/html.js';
import { field } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { bloquearBoton, datosFormulario, mostrarErroresFormulario } from '../utils/dom.js';
import { ValidationError, getErrorMessage } from '../../domain/errors.js';
import { homePathForRole } from '../../domain/authorization.js';
import { normalizarDestino } from '../router.js';
import { RUTAS } from '../../domain/constants.js';

export const registroPage = {
  render( ctx ){
    const enlaceLogin = ctx.query.redirect
      ? `${ RUTAS.LOGIN }?redirect=${ encodeURIComponent( ctx.query.redirect ) }`
      : RUTAS.LOGIN;

    return html`
      <div class="auth-form-head">
        <span class="eyebrow">Nueva cuenta</span>
        <h2>Crea tu cuenta</h2>
        <p>Regístrate como cliente para consultar el catálogo, tus préstamos y tus compras.</p>
      </div>

      <form class="auth-form form-grid" data-register-form novalidate>
        ${ field({ label: 'Identificación', name: 'identificacion', placeholder: 'Ej. 2001', required: true, autocomplete: 'username' }) }
        ${ field({ label: 'Nombre completo', name: 'nombre', placeholder: 'Tu nombre', required: true, autocomplete: 'name' }) }
        ${ field({ label: 'Teléfono', name: 'telefono', placeholder: '5555-0000', required: true, autocomplete: 'tel' }) }
        ${ field({ label: 'Correo electrónico', name: 'email', type: 'email', placeholder: 'tu@correo.com', required: true, autocomplete: 'email' }) }
        ${ field({ label: 'Dirección', name: 'direccion', placeholder: 'Calle, zona y número', required: true, autocomplete: 'street-address', maxlength: 255 }) }
        ${ field({ label: 'Contraseña', name: 'password', type: 'password', placeholder: '8 a 72 caracteres', required: true, autocomplete: 'new-password', help: 'Mínimo 8 caracteres.' }) }

        <p class="form-alert form-grid-full" data-form-error role="alert" hidden></p>

        <div class="form-grid-full">
          <button type="submit" class="btn btn-primary btn-block btn-lg" data-submit>
            ${ icon( 'sparkles', 18 ) } Crear cuenta
          </button>
        </div>
      </form>

      <p class="auth-switch">
        ¿Ya tienes cuenta?
        <a href="${ enlaceLogin }" data-link>Inicia sesión</a>
      </p>
    `;
  },

  mount( root, ctx ){
    const formulario = root.querySelector( '[data-register-form]' );
    if( !formulario ) return;

    const errorBox = formulario.querySelector( '[data-form-error]' );
    const boton = formulario.querySelector( '[data-submit]' );

    formulario.addEventListener( 'submit', async evento => {
      evento.preventDefault();
      errorBox.hidden = true;
      bloquearBoton( boton, true, 'Creando cuenta…' );

      try {
        const { sesion } = await ctx.auth.registro( datosFormulario( formulario ) );
        if( sesion ){
          ctx.toast( 'Tu cuenta se creó y la sesión está lista.', { type: 'success', title: 'Registro completado' } );
          await ctx.navigate( normalizarDestino( ctx.query.redirect ) ?? homePathForRole( sesion.role ) );
        }
        else {
          ctx.toast( 'Tu cuenta se creó. Inicia sesión con tus credenciales.', { type: 'success', title: 'Registro completado' } );
          await ctx.navigate( RUTAS.LOGIN, { replace: true } );
        }
      }
      catch( error ){
        if( error instanceof ValidationError ){
          mostrarErroresFormulario( formulario, error.errors );
        }
        else {
          errorBox.textContent = getErrorMessage( error );
          errorBox.hidden = false;
        }
        ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo completar el registro' } );
      }
      finally {
        bloquearBoton( boton, false );
      }
    });
  }
};
