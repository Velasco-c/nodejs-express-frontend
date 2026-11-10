import { html } from '../utils/html.js';
import { badge, emptyState, money, pageHeader, pagination } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { formatDate } from '../../domain/formatters.js';
import { RUTAS } from '../../domain/constants.js';

const estado = valor => badge(
  valor === 'confirmado' ? 'Confirmado' : valor === 'rechazado' ? 'Rechazado' : 'Pendiente de confirmación',
  valor === 'confirmado' ? 'success' : valor === 'rechazado' ? 'danger' : 'warning'
);

export const misPedidosPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const limite = ctx.config.pageSize;
    const resultado = await ctx.services.ventas.misPedidos({ pagina, limite });
    return html`
      ${ pageHeader({
        eyebrow: 'Mi cuenta',
        title: 'Mis pedidos',
        description: 'Consulta el estado de tus pedidos. La venta se registra cuando administración confirma disponibilidad y entrega.',
        actions: html`<a href="${ RUTAS.CATALOGO }" data-link class="btn btn-ghost">${ icon( 'library', 17 ) } Volver al catálogo</a>`
      }) }
      <section class="card">
        ${ resultado.items.length === 0
          ? emptyState({
            iconName: 'shopping-bag', title: 'Aún no tienes pedidos',
            message: 'Los pedidos que envíes desde el carrito aparecerán aquí.',
            action: html`<a href="${ RUTAS.CATALOGO }" data-link class="btn btn-primary">Explorar libros</a>`
          })
          : html`
            <div class="table-wrap"><table class="data-table">
              <thead><tr><th>Pedido</th><th>Fecha</th><th>Libros</th><th>Total cotizado</th><th>Estado</th><th>Venta</th></tr></thead>
              <tbody>${ resultado.items.map( pedido => html`
                <tr>
                  <td><span class="mono">${ pedido.id }</span></td>
                  <td>${ formatDate( pedido.fecha ) }</td>
                  <td><div class="sale-items-summary">${ pedido.items.map( item => html`<span>${ item.titulo } ×${ item.cantidad }</span>` ) }</div></td>
                  <td>${ money( pedido.total ) }</td>
                  <td>${ estado( pedido.estado ) }</td>
                  <td>${ pedido.ventaId ? html`<a href="${ RUTAS.MIS_COMPRAS }" data-link class="link-subtle">${ pedido.ventaId }</a>` : '—' }</td>
                </tr>
              ` ) }</tbody>
            </table></div>
          ` }
        ${ pagination({ total: resultado.total, pagina, limite, basePath: RUTAS.MIS_PEDIDOS }) }
      </section>
    `;
  }
};
