import { html } from '../utils/html.js';
import { avatar, badge, detailGrid, emptyState, pageHeader, pagination } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { getErrorMessage } from '../../domain/errors.js';
import { RUTAS } from '../../domain/constants.js';

function detalleUsuario( usuario ){
  return html`
    <div class="profile-summary">
      ${ avatar( usuario.nombre, 'lg' ) }
      <div>
        <h3>${ usuario.nombre }</h3>
        <p><span class="mono">${ usuario.identificacion }</span> · ${ badge( 'Cliente', 'success' ) }</p>
      </div>
    </div>
    ${ detailGrid([
      { label: 'Identificación', value: usuario.identificacion },
      { label: 'Correo electrónico', value: usuario.email },
      { label: 'Teléfono', value: usuario.telefono },
      { label: 'Dirección', value: usuario.direccion }
    ]) }
    <div class="info-note">
      ${ icon( 'info', 17 ) }
      <p>El historial completo de préstamos y compras se consulta desde los módulos correspondientes.</p>
    </div>
  `;
}

export const usuariosPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const limite = ctx.config.pageSize;
    const resultado = await ctx.services.usuarios.listar({ pagina, limite });

    return html`
      ${ pageHeader({
        eyebrow: 'Clientes',
        title: 'Usuarios registrados',
        description: 'Consulta la información de contacto de los clientes de la librería.',
        actions: html`<span class="header-chip">${ icon( 'users', 17 ) } ${ resultado.total } ${ resultado.total === 1 ? 'cliente' : 'clientes' }</span>`
      }) }

      <section class="card">
        ${ resultado.items.length === 0
          ? emptyState({ iconName: 'users', title: 'Sin clientes', message: 'Los clientes registrados aparecerán en esta lista.' })
          : html`
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Identificación</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${ resultado.items.map( usuario => html`
                    <tr>
                      <td>
                        <div class="user-cell">
                          ${ avatar( usuario.nombre, 'sm' ) }
                          <strong>${ usuario.nombre }</strong>
                        </div>
                      </td>
                      <td><span class="mono">${ usuario.identificacion }</span></td>
                      <td>${ usuario.email }</td>
                      <td>${ usuario.telefono }</td>
                      <td class="cell-muted">${ usuario.direccion }</td>
                      <td>
                        <div class="row-actions">
                          <button type="button" class="btn btn-ghost btn-sm" data-user-id="${ usuario.identificacion }">
                            ${ icon( 'eye', 16 ) } Ver detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ` ) }
                </tbody>
              </table>
            </div>
          ` }

        ${ pagination({ total: resultado.total, pagina, limite, basePath: RUTAS.ADMIN_USUARIOS }) }
      </section>
    `;
  },

  mount( root, ctx ){
    const contenedor = root.querySelector( '#contenido' ) ?? root;

    const manejarClick = async evento => {
      const boton = evento.target.closest( '[data-user-id]' );
      if( !boton ) return;

      const identificacion = boton.dataset.userId;
      try {
        const usuario = await ctx.services.usuarios.obtener( identificacion );
        openModal({
          title: 'Detalle del cliente',
          subtitle: 'Información registrada en la librería',
          content: detalleUsuario( usuario ),
          size: 'md'
        });
      }
      catch( error ){
        ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo cargar el cliente' } );
      }
    };

    contenedor.addEventListener( 'click', manejarClick );

    return () => contenedor.removeEventListener( 'click', manejarClick );
  }
};
