import { html } from '../utils/html.js';
import { emptyState, money, pageHeader, pagination } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { formatCurrency, formatDate } from '../../domain/formatters.js';
import { RUTAS } from '../../domain/constants.js';

export const misComprasPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const limite = ctx.config.pageSize;
    const resultado = await ctx.services.ventas.misCompras({ pagina, limite });

    return html`
      ${ pageHeader({
        eyebrow: 'Mi historial',
        title: 'Mis compras',
        description: 'Revisa los libros que has comprado y el detalle de cada comprobante.',
        actions: html`
          <a href="${ RUTAS.CATALOGO }" data-link class="btn btn-ghost">
            ${ icon( 'library', 17 ) } Ir al catálogo
          </a>
        `
      }) }

      ${ resultado.items.length === 0
        ? html`
          <section class="card">
            ${ emptyState({
              iconName: 'shopping-bag',
              title: 'Aún no tienes compras',
              message: 'Las compras que realices en la librería aparecerán aquí.',
              action: html`<a href="${ RUTAS.CATALOGO }" data-link class="btn btn-primary">${ icon( 'book-open', 17 ) } Explorar catálogo</a>`
            }) }
          </section>
        `
        : html`
          <div class="purchase-list">
            ${ resultado.items.map( venta => html`
              <article class="purchase-card card">
                <header class="purchase-head">
                  <div class="purchase-id">
                    <span class="purchase-icon">${ icon( 'shopping-bag', 20 ) }</span>
                    <div>
                      <span class="eyebrow">Comprobante</span>
                      <h2>${ venta.id }</h2>
                    </div>
                  </div>
                  <div class="purchase-meta">
                    <span>${ formatDate( venta.fecha ) }</span>
                    <strong>${ formatCurrency( venta.total ) }</strong>
                  </div>
                </header>

                <div class="table-wrap">
                  <table class="data-table purchase-table">
                    <thead>
                      <tr>
                        <th>Libro</th>
                        <th class="text-right">Cantidad</th>
                        <th class="text-right">Precio unitario</th>
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
                    <tfoot>
                      <tr>
                        <td colspan="3" class="text-right">Total</td>
                        <td class="text-right"><strong>${ money( venta.total ) }</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </article>
            ` ) }
          </div>

          ${ pagination({ total: resultado.total, pagina, limite, basePath: RUTAS.MIS_COMPRAS }) }
        ` }
    `;
  }
};
