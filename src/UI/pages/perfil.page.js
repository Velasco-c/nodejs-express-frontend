import { html } from '../utils/html.js';
import { avatar, badge, card, field, infoRow, pageHeader, textareaField } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { bloquearBoton, datosFormulario, mostrarErroresFormulario } from '../utils/dom.js';
import { ValidationError, getErrorMessage } from '../../domain/errors.js';

export const perfilPage = {
  async render( ctx ){
    const usuario = await ctx.auth.cargarPerfil();

    return html`
      ${ pageHeader({
        eyebrow: 'Mi cuenta',
        title: 'Mi perfil',
        description: 'Mantén tus datos de contacto actualizados para tus préstamos y compras.'
      }) }

      <div class="profile-layout">
        <aside class="profile-card card">
          <div class="profile-card-head">
            ${ avatar( usuario.nombre, 'xl' ) }
            <h2>${ usuario.nombre }</h2>
            <span class="mono profile-id">${ usuario.identificacion }</span>
            ${ badge( 'Cliente', 'success' ) }
          </div>
          <div class="profile-info">
            ${ infoRow( 'Correo', usuario.email, 'mail' ) }
            ${ infoRow( 'Teléfono', usuario.telefono, 'phone' ) }
            ${ infoRow( 'Dirección', usuario.direccion, 'map-pin' ) }
          </div>
          <div class="profile-note">
            ${ icon( 'info', 17 ) }
            <p>La identificación de tu cuenta no se puede modificar.</p>
          </div>
        </aside>

        ${ card({
          title: 'Datos personales',
          subtitle: 'Actualiza tu información y, si lo deseas, tu contraseña.',
          body: html`
            <form class="form-grid profile-form" data-profile-form novalidate>
              ${ field({
                label: 'Identificación',
                name: 'identificacion',
                value: usuario.identificacion,
                readonly: true,
                help: 'Este campo no es editable.'
              }) }
              ${ field({ label: 'Nombre completo', name: 'nombre', value: usuario.nombre, required: true, autocomplete: 'name' }) }
              ${ field({ label: 'Teléfono', name: 'telefono', value: usuario.telefono, required: true, autocomplete: 'tel' }) }
              ${ field({ label: 'Correo electrónico', name: 'email', type: 'email', value: usuario.email, required: true, autocomplete: 'email' }) }
              ${ textareaField({ label: 'Dirección', name: 'direccion', value: usuario.direccion, required: true, rows: 2 }) }
              ${ field({
                label: 'Nueva contraseña',
                name: 'password',
                type: 'password',
                placeholder: 'Déjala vacía para conservar la actual',
                autocomplete: 'new-password',
                help: 'Si la cambias, debe tener entre 8 y 72 caracteres.'
              }) }

              <p class="form-alert form-grid-full" data-form-error role="alert" hidden></p>

              <div class="form-actions form-grid-full">
                <button type="submit" class="btn btn-primary" data-submit>
                  ${ icon( 'check', 17 ) } Guardar cambios
                </button>
              </div>
            </form>
          `
        }) }
      </div>
    `;
  },

  mount( root, ctx ){
    const formulario = root.querySelector( '[data-profile-form]' );
    if( !formulario ) return;

    const boton = formulario.querySelector( '[data-submit]' );
    const errorBox = formulario.querySelector( '[data-form-error]' );

    formulario.addEventListener( 'submit', async evento => {
      evento.preventDefault();
      errorBox.hidden = true;
      bloquearBoton( boton, true, 'Guardando…' );

      try {
        const datos = datosFormulario( formulario );
        await ctx.auth.actualizarPerfil({
          nombre: datos.nombre,
          telefono: datos.telefono,
          direccion: datos.direccion,
          email: datos.email,
          ...( datos.password ? { password: datos.password } : {} )
        });
        ctx.toast( 'Tus datos se actualizaron correctamente.', { type: 'success', title: 'Perfil actualizado' } );
        await ctx.refresh();
      }
      catch( error ){
        if( error instanceof ValidationError ) mostrarErroresFormulario( formulario, error.errors );
        else {
          errorBox.textContent = getErrorMessage( error );
          errorBox.hidden = false;
        }
        ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo actualizar el perfil' } );
      }
      finally {
        bloquearBoton( boton, false );
      }
    });
  }
};
