import { html } from '../utils/html.js';
import { badge, emptyState, money, pageHeader, pagination } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { confirmAction } from '../components/modal.js';
import { getErrorMessage } from '../../domain/errors.js';
import { formatDate } from '../../domain/formatters.js';
import { RUTAS } from '../../domain/constants.js';

const estado = valor => badge(
  valor === 'confirmado' ? 'Confirmado' : valor === 'rechazado' ? 'Rechazado' : 'Pendiente',
  valor === 'confirmado' ? 'success' : valor === 'rechazado' ? 'danger' : 'warning'
);

export const pedidosPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const limite = ctx.config.pageSize;
    const resultado = await ctx.services.ventas.listarPedidos({ pagina, limite });
    const pendientes = resultado.items.filter( pedido => pedido.estado === 'pendiente' ).length;
    return html`
      ${ pageHeader({
        eyebrow: 'Operación de compras', title: 'Pedidos de clientes',
        description: 'Confirma la disponibilidad antes de registrar la venta. El inventario se descuenta al confirmar.',
        actions: html`<span class="header-chip">${ icon( 'clock', 17 ) } ${ pendientes } pendientes en esta página</span>`
      }) }
      <section class="card">
        ${ resultado.items.length === 0
          ? emptyState({ iconName: 'shopping-bag', title: 'Sin pedidos', message: 'Los pedidos de clientes aparecerán aquí.' })
          : html`
            <div class="table-wrap"><table class="data-table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Artículos</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>${ resultado.items.map( pedido => html`
                <tr>
                  <td><span class="mono">${ pedido.id }</span></td>
                  <td><span class="mono">${ pedido.identificacionCliente }</span></td>
                  <td>${ formatDate( pedido.fecha ) }</td>
                  <td><div class="sale-items-summary">${ pedido.items.map( item => html`<span>${ item.titulo } ×${ item.cantidad }</span>` ) }</div></td>
                  <td>${ money( pedido.total ) }</td>
                  <td>${ estado( pedido.estado ) }</td>
                  <td><div class="row-actions">
                    ${ pedido.estado === 'pendiente' ? html`
                      <button type="button" class="btn btn-primary btn-sm" data-resolve-order="confirmar" data-order-id="${ pedido.id }">${ icon( 'check', 15 ) } Confirmar</button>
                      <button type="button" class="btn btn-ghost btn-sm" data-resolve-order="rechazar" data-order-id="${ pedido.id }">Rechazar</button>
                    ` : pedido.ventaId ? html`<span class="mono">${ pedido.ventaId }</span>` : '—' }
                  </div></td>
                </tr>
              ` ) }</tbody>
            </table></div>
          ` }
        ${ pagination({ total: resultado.total, pagina, limite, basePath: RUTAS.ADMIN_PEDIDOS }) }
      </section>
    `;
  },

  mount( root, ctx ){
    const contenedor = root.querySelector( '#contenido' ) ?? root;
    const manejarClick = async evento => {
      const boton = evento.target.closest( '[data-resolve-order]' );
      if( !boton ) return;
      const accion = boton.dataset.resolveOrder;
      const confirmar = await confirmAction({
        title: accion === 'confirmar' ? 'Confirmar pedido' : 'Rechazar pedido',
        message: accion === 'confirmar'
          ? 'Se comprobará el stock y se registrará la venta. ¿Continuar?'
          : 'El pedido quedará marcado como rechazado. ¿Continuar?',
        confirmLabel: accion === 'confirmar' ? 'Confirmar venta' : 'Rechazar pedido',
        tone: accion === 'confirmar' ? 'primary' : 'danger'
      });
      if( !confirmar ) return;
      boton.disabled = true;
      try {
        await ctx.services.ventas.resolverPedido( boton.dataset.orderId, accion );
        ctx.toast( accion === 'confirmar' ? 'La venta quedó registrada.' : 'El pedido fue rechazado.', {
          type: 'success', title: accion === 'confirmar' ? 'Pedido confirmado' : 'Pedido rechazado'
        });
        await ctx.refresh();
      }
      catch( error ){
        boton.disabled = false;
        ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo resolver el pedido' } );
      }
    };
    contenedor.addEventListener( 'click', manejarClick );
    return () => contenedor.removeEventListener( 'click', manejarClick );
  }
};
