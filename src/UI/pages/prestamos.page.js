import { html } from '../utils/html.js';
import { badge, emptyState, field, loanBadge, pageHeader, pagination } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { confirmAction, openModal } from '../components/modal.js';
import { bloquearBoton, datosFormulario, mostrarErroresFormulario } from '../utils/dom.js';
import { ValidationError, getErrorMessage } from '../../domain/errors.js';
import { formatDate, hoyISO } from '../../domain/formatters.js';
import { RUTAS } from '../../domain/constants.js';

function fechaEnDias( dias ){
  const fecha = new Date();
  fecha.setDate( fecha.getDate() + dias );
  return fecha.toISOString().slice( 0, 10 );
}

function formularioPrestamo(){
  return html`
    <form class="form-grid" data-loan-form novalidate>
      ${ field({ label: 'Código del libro', name: 'codigoLibro', placeholder: 'Ej. L001', required: true, help: 'Debe existir en el catálogo y tener stock disponible.' }) }
      ${ field({ label: 'Identificación del cliente', name: 'identificacionUsuario', placeholder: 'Ej. 1001', required: true, help: 'El cliente debe estar registrado.' }) }
      ${ field({ label: 'Fecha del préstamo', name: 'fechaPrestamo', type: 'date', value: hoyISO(), required: true }) }
      ${ field({ label: 'Fecha tentativa de devolución', name: 'fechaTentativaDevolucion', type: 'date', value: fechaEnDias( 7 ), required: true }) }

      <p class="form-alert form-grid-full" data-form-error role="alert" hidden></p>

      <footer class="modal-actions form-grid-full">
        <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn-primary" data-submit>${ icon( 'repeat', 17 ) } Registrar préstamo</button>
      </footer>
    </form>
  `;
}

function formularioDevolucion( prestamo ){
  return html`
    <form class="detail-form" data-return-form novalidate>
      <div class="return-summary">
        <span class="return-icon">${ icon( 'repeat', 21 ) }</span>
        <div>
          <strong>${ prestamo.id }</strong>
          <p>Libro <span class="mono">${ prestamo.codigoLibro }</span> · Cliente ${ prestamo.identificacionUsuario }</p>
        </div>
      </div>

      ${ field({ label: 'Fecha de devolución', name: 'fechaDevolucion', type: 'date', value: hoyISO(), required: true, help: 'Al registrar la devolución se repone una unidad al stock.' }) }

      <p class="form-alert" data-form-error role="alert" hidden></p>

      <footer class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn-primary" data-submit>${ icon( 'check', 17 ) } Confirmar devolución</button>
      </footer>
    </form>
  `;
}

export const prestamosPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const paginaSolicitudes = Math.max( 1, Number( ctx.query.solicitudesPagina ) || 1 );
    const limite = ctx.config.pageSize;
    const [resultado, solicitudes] = await Promise.all([
      ctx.services.prestamos.listar({ pagina, limite }),
      ctx.services.prestamos.listarSolicitudes({ pagina: paginaSolicitudes, limite })
    ]);
    const activos = resultado.items.filter( prestamo => !prestamo.fechaDevolucion ).length;

    return html`
      ${ pageHeader({
        eyebrow: 'Circulación',
        title: 'Préstamos',
        description: 'Registra salidas de libros y controla las devoluciones del catálogo.',
        actions: html`
          <span class="header-chip">${ icon( 'clock', 17 ) } ${ activos } ${ activos === 1 ? 'activo' : 'activos' } en esta página</span>
          <button type="button" class="btn btn-primary" data-new-loan>
            ${ icon( 'plus', 18 ) } Registrar préstamo
          </button>
        `
      }) }

      <section class="card">
        ${ resultado.items.length === 0
          ? emptyState({
            iconName: 'repeat',
            title: 'Sin préstamos registrados',
            message: 'Cuando prestes un libro, el movimiento aparecerá aquí.',
            action: html`<button type="button" class="btn btn-primary" data-new-loan>${ icon( 'plus', 17 ) } Registrar préstamo</button>`
          })
          : html`
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Préstamo</th>
                    <th>Libro</th>
                    <th>Cliente</th>
                    <th>Prestado</th>
                    <th>Devolución prevista</th>
                    <th>Devuelto</th>
                    <th>Estado</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${ resultado.items.map( prestamo => html`
                    <tr>
                      <td><span class="mono">${ prestamo.id }</span></td>
                      <td><span class="mono">${ prestamo.codigoLibro }</span></td>
                      <td><span class="mono">${ prestamo.identificacionUsuario }</span></td>
                      <td>${ formatDate( prestamo.fechaPrestamo ) }</td>
                      <td>${ formatDate( prestamo.fechaTentativaDevolucion ) }</td>
                      <td>${ prestamo.fechaDevolucion ? formatDate( prestamo.fechaDevolucion ) : '—' }</td>
                      <td>${ loanBadge( prestamo ) }</td>
                      <td>
                        <div class="row-actions">
                          ${ prestamo.fechaDevolucion
                            ? html`<span class="row-done">${ icon( 'check', 15 ) } Completado</span>`
                            : html`
                              <button type="button" class="btn btn-ghost btn-sm" data-return-loan="${ prestamo.id }">
                                ${ icon( 'check-circle', 16 ) } Devolver
                              </button>
                            ` }
                        </div>
                      </td>
                    </tr>
                  ` ) }
                </tbody>
              </table>
            </div>
          ` }

        ${ pagination({
          total: resultado.total,
          pagina,
          limite,
          basePath: RUTAS.ADMIN_PRESTAMOS,
          query: { ...( ctx.query.solicitudesPagina ? { solicitudesPagina: ctx.query.solicitudesPagina } : {} ) }
        }) }
      </section>

      <section class="card section-spaced">
        <header class="card-head">
          <div><h2>Solicitudes de clientes</h2><p>El stock solo se descuenta cuando apruebas una solicitud.</p></div>
          <span class="header-chip">${ solicitudes.items.filter( solicitud => solicitud.estado === 'pendiente' ).length } pendientes en esta página</span>
        </header>
        ${ solicitudes.items.length === 0
          ? emptyState({ iconName: 'clock', title: 'Sin solicitudes pendientes', message: 'Las solicitudes de clientes aparecerán aquí.' })
          : html`
            <div class="table-wrap"><table class="data-table">
              <thead><tr><th>Solicitud</th><th>Libro</th><th>Cliente</th><th>Enviada</th><th>Devolución tentativa</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>${ solicitudes.items.map( solicitud => html`
                <tr>
                  <td><span class="mono">${ solicitud.id }</span></td>
                  <td><div class="cell-stack"><strong>${ solicitud.titulo ?? solicitud.codigoLibro }</strong><span class="mono">${ solicitud.codigoLibro }</span></div></td>
                  <td><span class="mono">${ solicitud.identificacionUsuario }</span></td>
                  <td>${ formatDate( solicitud.fechaSolicitud ) }</td>
                  <td>${ formatDate( solicitud.fechaTentativaDevolucion ) }</td>
                  <td>${ badge( solicitud.estado === 'aprobada' ? 'Aprobada' : solicitud.estado === 'rechazada' ? 'Rechazada' : 'Pendiente', solicitud.estado === 'aprobada' ? 'success' : solicitud.estado === 'rechazada' ? 'danger' : 'warning' ) }</td>
                  <td><div class="row-actions">
                    ${ solicitud.estado === 'pendiente' ? html`
                      <button type="button" class="btn btn-primary btn-sm" data-resolve-loan-request="aprobar" data-request-id="${ solicitud.id }">${ icon( 'check', 15 ) } Aprobar</button>
                      <button type="button" class="btn btn-ghost btn-sm" data-resolve-loan-request="rechazar" data-request-id="${ solicitud.id }">Rechazar</button>
                    ` : solicitud.prestamoId ? html`<span class="mono">${ solicitud.prestamoId }</span>` : '—' }
                  </div></td>
                </tr>
              ` ) }</tbody>
            </table></div>
          ` }
        ${ pagination({
          total: solicitudes.total,
          pagina: paginaSolicitudes,
          limite,
          basePath: RUTAS.ADMIN_PRESTAMOS,
          query: { ...( ctx.query.pagina ? { pagina: ctx.query.pagina } : {} ) },
          pageParam: 'solicitudesPagina'
        }) }
      </section>
    `;
  },

  mount( root, ctx ){
    const contenedor = root.querySelector( '#contenido' ) ?? root;

    function abrirPrestamo(){
      openModal({
        title: 'Registrar préstamo',
        subtitle: 'El stock del libro se descuenta automáticamente al confirmar.',
        content: formularioPrestamo(),
        size: 'md',
        onMount( elemento, cerrar ){
          const formulario = elemento.querySelector( '[data-loan-form]' );
          const boton = formulario.querySelector( '[data-submit]' );
          const errorBox = formulario.querySelector( '[data-form-error]' );
          elemento.querySelector( '[data-close]' )?.addEventListener( 'click', cerrar );

          formulario.addEventListener( 'submit', async evento => {
            evento.preventDefault();
            errorBox.hidden = true;
            bloquearBoton( boton, true, 'Registrando…' );

            try {
              const prestamo = await ctx.services.prestamos.registrar( datosFormulario( formulario ) );
              ctx.toast( `Préstamo ${ prestamo.id } registrado para ${ prestamo.identificacionUsuario }.`, {
                type: 'success',
                title: 'Préstamo creado'
              });
              cerrar();
              await ctx.refresh();
            }
            catch( error ){
              if( error instanceof ValidationError ) mostrarErroresFormulario( formulario, error.errors );
              else {
                errorBox.textContent = getErrorMessage( error );
                errorBox.hidden = false;
              }
              ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo registrar el préstamo' } );
            }
            finally {
              bloquearBoton( boton, false );
            }
          });
        }
      });
    }

    async function abrirDevolucion( id, fila ){
      const celdas = fila?.querySelectorAll( 'td' ) ?? [];
      const prestamo = {
        id,
        codigoLibro: celdas[1]?.textContent?.trim() ?? '',
        identificacionUsuario: celdas[2]?.textContent?.trim() ?? ''
      };

      openModal({
        title: 'Registrar devolución',
        subtitle: 'Confirma la fecha en que el libro regresa a la librería.',
        content: formularioDevolucion( prestamo ),
        size: 'sm',
        onMount( elemento, cerrar ){
          const formulario = elemento.querySelector( '[data-return-form]' );
          const boton = formulario.querySelector( '[data-submit]' );
          const errorBox = formulario.querySelector( '[data-form-error]' );
          elemento.querySelector( '[data-close]' )?.addEventListener( 'click', cerrar );

          formulario.addEventListener( 'submit', async evento => {
            evento.preventDefault();
            errorBox.hidden = true;
            bloquearBoton( boton, true, 'Procesando…' );

            try {
              await ctx.services.prestamos.devolver( id, formulario.elements.fechaDevolucion.value );
              ctx.toast( `La devolución de ${ id } se registró correctamente.`, {
                type: 'success',
                title: 'Devolución registrada'
              });
              cerrar();
              await ctx.refresh();
            }
            catch( error ){
              if( error instanceof ValidationError ) mostrarErroresFormulario( formulario, error.errors );
              else {
                errorBox.textContent = getErrorMessage( error );
                errorBox.hidden = false;
              }
              ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo registrar la devolución' } );
            }
            finally {
              bloquearBoton( boton, false );
            }
          });
        }
      });
    }

    const manejarClick = async evento => {
      const resolver = evento.target.closest( '[data-resolve-loan-request]' );
      if( resolver ){
        const accion = resolver.dataset.resolveLoanRequest;
        const confirmado = await confirmAction({
          title: accion === 'aprobar' ? 'Aprobar solicitud' : 'Rechazar solicitud',
          message: accion === 'aprobar'
            ? 'Se creará el préstamo y se descontará una unidad del inventario. ¿Continuar?'
            : 'La solicitud quedará marcada como rechazada. ¿Continuar?',
          confirmLabel: accion === 'aprobar' ? 'Aprobar préstamo' : 'Rechazar solicitud',
          tone: accion === 'aprobar' ? 'primary' : 'danger'
        });
        if( !confirmado ) return;
        resolver.disabled = true;
        try {
          await ctx.services.prestamos.resolverSolicitud( resolver.dataset.requestId, accion );
          ctx.toast( accion === 'aprobar' ? 'El préstamo fue creado y el stock actualizado.' : 'La solicitud fue rechazada.', {
            type: 'success', title: accion === 'aprobar' ? 'Solicitud aprobada' : 'Solicitud rechazada'
          });
          await ctx.refresh();
        }
        catch( error ){
          resolver.disabled = false;
          ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo resolver la solicitud' } );
        }
        return;
      }

      if( evento.target.closest( '[data-new-loan]' ) ){
        abrirPrestamo();
        return;
      }

      const devolver = evento.target.closest( '[data-return-loan]' );
      if( devolver ){
        abrirDevolucion( devolver.dataset.returnLoan, devolver.closest( 'tr' ) );
      }
    };

    contenedor.addEventListener( 'click', manejarClick );

    return () => contenedor.removeEventListener( 'click', manejarClick );
  }
};
