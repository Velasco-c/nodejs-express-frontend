import { html, render } from '../utils/html.js';
import { emptyState, money, pageHeader, pagination } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { bloquearBoton, datosFormulario } from '../utils/dom.js';
import { ValidationError, getErrorMessage } from '../../domain/errors.js';
import { formatCurrency, formatDate } from '../../domain/formatters.js';
import { RUTAS } from '../../domain/constants.js';

let ventasActuales = new Map();

function filaVenta( libros ){
  return html`
    <div class="sale-row" data-sale-row>
      <div class="field sale-book-field">
        <label class="sr-only" for="venta-libro">Libro</label>
        <select data-book-select aria-label="Libro">
          <option value="">Selecciona un libro…</option>
          ${ libros.map( libro => html`
            <option value="${ libro.codigo }" data-price="${ libro.precio }" data-stock="${ libro.stock }">
              ${ libro.codigo } · ${ libro.titulo } (stock: ${ libro.stock })
            </option>
          ` ) }
        </select>
      </div>
      <div class="field sale-qty-field">
        <label class="sr-only" for="venta-cantidad">Cantidad</label>
        <input type="number" data-quantity value="1" min="1" step="1" aria-label="Cantidad">
      </div>
      <button type="button" class="icon-btn icon-btn-danger sale-remove" data-remove-row aria-label="Quitar libro" title="Quitar libro">
        ${ icon( 'trash', 17 ) }
      </button>
    </div>
  `;
}

function formularioVenta( libros, clientes ){
  return html`
    <form class="sale-form" data-sale-form novalidate>
      <div class="field">
        <label for="venta-cliente">Cliente<span class="req" aria-hidden="true">*</span></label>
        <input id="venta-cliente" name="identificacionCliente" list="lista-clientes" placeholder="Identificación del cliente" autocomplete="off" required>
        <datalist id="lista-clientes">
          ${ clientes.map( cliente => html`
            <option value="${ cliente.identificacion }">${ cliente.nombre }</option>
          ` ) }
        </datalist>
        <span class="field-help">Escribe o selecciona la identificación de un cliente registrado.</span>
        <span class="field-error" data-error-for="identificacionCliente"></span>
      </div>

      <div class="sale-items-head">
        <div>
          <h3>Libros de la venta</h3>
          <p>El total se calcula con el precio vigente al confirmar.</p>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-add-row>
          ${ icon( 'plus', 16 ) } Agregar libro
        </button>
      </div>

      <div class="sale-rows" data-sale-rows>
        ${ filaVenta( libros ) }
      </div>

      <p class="sale-error" data-sale-error role="alert" hidden></p>

      <div class="sale-total">
        <span>Total estimado</span>
        <strong data-sale-total>${ formatCurrency( 0 ) }</strong>
      </div>

      <footer class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn-primary" data-submit>
          ${ icon( 'check', 17 ) } Registrar venta
        </button>
      </footer>
    </form>
  `;
}

function detalleVenta( venta ){
  return html`
    <div class="sale-detail-head">
      <div>
        <span class="eyebrow">Comprobante</span>
        <h3>${ venta.id }</h3>
        <p>${ formatDate( venta.fecha ) } · Cliente ${ venta.identificacionCliente }</p>
      </div>
      <span class="sale-total-badge">${ formatCurrency( venta.total ) }</span>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Libro</th>
            <th class="text-right">Cantidad</th>
            <th class="text-right">Precio</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${ ( venta.items ?? [] ).map( item => html`
            <tr>
              <td>
                <div class="cell-stack">
                  <strong>${ item.titulo }</strong>
                  <span class="mono">${ item.codigo }</span>
                </div>
              </td>
              <td class="text-right">${ item.cantidad }</td>
              <td class="text-right">${ money( item.precioUnitario ) }</td>
              <td class="text-right">${ money( item.subtotal ) }</td>
            </tr>
          ` ) }
        </tbody>
      </table>
    </div>

    <div class="sale-detail-total">
      <span>Total</span>
      <strong>${ formatCurrency( venta.total ) }</strong>
    </div>
  `;
}

export const ventasPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const limite = ctx.config.pageSize;
    const resultado = await ctx.services.ventas.listar({ pagina, limite });

    ventasActuales = new Map( resultado.items.map( venta => [ String( venta.id ), venta ] ) );

    return html`
      ${ pageHeader({
        eyebrow: 'Punto de venta',
        title: 'Ventas',
        description: 'Registra compras de uno o varios libros y consulta el historial de transacciones.',
        actions: html`
          <span class="header-chip">${ icon( 'cart', 17 ) } ${ resultado.total } ${ resultado.total === 1 ? 'venta' : 'ventas' }</span>
          <button type="button" class="btn btn-primary" data-new-sale>
            ${ icon( 'plus', 18 ) } Nueva venta
          </button>
        `
      }) }

      <section class="card">
        ${ resultado.items.length === 0
          ? emptyState({
            iconName: 'cart',
            title: 'Sin ventas registradas',
            message: 'Registra la primera venta para comenzar el historial.',
            action: html`<button type="button" class="btn btn-primary" data-new-sale>${ icon( 'plus', 17 ) } Nueva venta</button>`
          })
          : html`
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Venta</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Libros</th>
                    <th class="text-right">Total</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${ resultado.items.map( venta => html`
                    <tr>
                      <td><span class="mono">${ venta.id }</span></td>
                      <td><span class="mono">${ venta.identificacionCliente }</span></td>
                      <td>${ formatDate( venta.fecha ) }</td>
                      <td>
                        <div class="sale-items-summary">
                          ${ ( venta.items ?? [] ).slice( 0, 2 ).map( item => html`<span>${ item.titulo } ×${ item.cantidad }</span>` ) }
                          ${ ( venta.items?.length ?? 0 ) > 2 ? html`<span class="muted">+${ venta.items.length - 2 } más</span>` : '' }
                        </div>
                      </td>
                      <td class="text-right">${ money( venta.total ) }</td>
                      <td>
                        <div class="row-actions">
                          <button type="button" class="btn btn-ghost btn-sm" data-sale-id="${ venta.id }">
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

        ${ pagination({ total: resultado.total, pagina, limite, basePath: RUTAS.ADMIN_VENTAS }) }
      </section>
    `;
  },

  mount( root, ctx ){
    async function abrirNuevaVenta(){
      let libros;
      let clientes;
      try {
        const [resultadoLibros, resultadoClientes] = await Promise.all([
          ctx.services.libros.listar({ pagina: 1, limite: 100 }),
          ctx.services.usuarios.listar({ pagina: 1, limite: 100 })
        ]);
        libros = resultadoLibros.items;
        clientes = resultadoClientes.items;
      }
      catch( error ){
        ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudieron cargar los datos' } );
        return;
      }

      if( libros.length === 0 ){
        ctx.toast( 'No hay libros registrados para vender.', { type: 'warning', title: 'Catálogo vacío' } );
        return;
      }

      openModal({
        title: 'Nueva venta',
        subtitle: 'Selecciona el cliente y los libros que va a comprar.',
        content: formularioVenta( libros, clientes ),
        size: 'lg',
        onMount( elemento, cerrar ){
          const formulario = elemento.querySelector( '[data-sale-form]' );
          const filas = formulario.querySelector( '[data-sale-rows]' );
          const total = formulario.querySelector( '[data-sale-total]' );
          const errorBox = formulario.querySelector( '[data-sale-error]' );
          const boton = formulario.querySelector( '[data-submit]' );

          const actualizarTotal = () => {
            let suma = 0;
            for( const fila of filas.querySelectorAll( '[data-sale-row]' ) ){
              const select = fila.querySelector( '[data-book-select]' );
              const cantidad = Number( fila.querySelector( '[data-quantity]' ).value ) || 0;
              const precio = Number( select.selectedOptions[0]?.dataset.price ) || 0;
              suma += precio * cantidad;
            }
            total.textContent = formatCurrency( suma );
          };

          const actualizarBotonQuitar = () => {
            const botones = filas.querySelectorAll( '[data-remove-row]' );
            for( const botonQuitar of botones ) botonQuitar.disabled = botones.length <= 1;
          };

          formulario.addEventListener( 'change', evento => {
            if( evento.target.matches( '[data-book-select], [data-quantity]' ) ) actualizarTotal();
          });
          formulario.addEventListener( 'input', evento => {
            if( evento.target.matches( '[data-quantity]' ) ) actualizarTotal();
          });

          formulario.querySelector( '[data-add-row]' )?.addEventListener( 'click', () => {
            filas.insertAdjacentHTML( 'beforeend', render( filaVenta( libros ) ) );
            actualizarBotonQuitar();
            actualizarTotal();
            filas.lastElementChild?.querySelector( '[data-book-select]' )?.focus();
          });

          filas.addEventListener( 'click', evento => {
            const quitar = evento.target.closest( '[data-remove-row]' );
            if( !quitar || filas.querySelectorAll( '[data-sale-row]' ).length <= 1 ) return;
            quitar.closest( '[data-sale-row]' )?.remove();
            actualizarBotonQuitar();
            actualizarTotal();
          });

          elemento.querySelector( '[data-close]' )?.addEventListener( 'click', cerrar );

          formulario.addEventListener( 'submit', async evento => {
            evento.preventDefault();
            errorBox.hidden = true;

            const librosSeleccionados = Array.from( filas.querySelectorAll( '[data-sale-row]' ) ).map( fila => ({
              codigo: fila.querySelector( '[data-book-select]' ).value,
              cantidad: Number( fila.querySelector( '[data-quantity]' ).value )
            }));

            bloquearBoton( boton, true, 'Registrando…' );

            try {
              const venta = await ctx.services.ventas.registrar( {
                identificacionCliente: datosFormulario( formulario ).identificacionCliente,
                libros: librosSeleccionados
              });

              ctx.toast( `Venta ${ venta.id } registrada por ${ formatCurrency( venta.total ) }.`, {
                type: 'success',
                title: 'Venta completada'
              });
              cerrar();
              await ctx.refresh();
              openModal({
                title: 'Venta registrada',
                subtitle: 'Resumen del comprobante',
                content: detalleVenta( venta ),
                size: 'md'
              });
            }
            catch( error ){
              if( error instanceof ValidationError ){
                errorBox.textContent = error.firstError;
                errorBox.hidden = false;
                const campo = formulario.querySelector( '[name="identificacionCliente"]' );
                campo?.classList.add( 'is-invalid' );
              }
              else {
                errorBox.textContent = getErrorMessage( error );
                errorBox.hidden = false;
              }
              ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo registrar la venta' } );
            }
            finally {
              bloquearBoton( boton, false );
            }
          });

          actualizarBotonQuitar();
          actualizarTotal();
        }
      });
    }

    const contenedor = root.querySelector( '#contenido' ) ?? root;

    const manejarClick = evento => {
      if( evento.target.closest( '[data-new-sale]' ) ){
        abrirNuevaVenta();
        return;
      }

      const ver = evento.target.closest( '[data-sale-id]' );
      if( ver ){
        const venta = ventasActuales.get( ver.dataset.saleId );
        if( !venta ){
          ctx.toast( 'No se encontró la venta seleccionada.', { type: 'error' } );
          return;
        }
        openModal({
          title: 'Detalle de la venta',
          subtitle: 'Productos y total registrados',
          content: detalleVenta( venta ),
          size: 'md'
        });
      }
    };

    contenedor.addEventListener( 'click', manejarClick );

    return () => contenedor.removeEventListener( 'click', manejarClick );
  }
};
