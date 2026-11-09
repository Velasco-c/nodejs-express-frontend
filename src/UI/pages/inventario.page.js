import { html } from '../utils/html.js';
import { emptyState, money, pageHeader, statCard, stockBadge } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { descargarCsv } from '../utils/dom.js';
import { formatCurrency, formatNumber } from '../../domain/formatters.js';
import { LOW_STOCK_DEFAULT, RUTAS } from '../../domain/constants.js';

let inventarioActual = null;

export const inventarioPage = {
  async render( ctx ){
    const solicitado = Number( ctx.query.minimo );
    const minimo = Number.isInteger( solicitado ) && solicitado >= 0 ? solicitado : LOW_STOCK_DEFAULT;
    const inventario = await ctx.services.inventario.resumen( minimo );
    inventarioActual = inventario;

    const valorBajo = inventario.stockBajo.reduce( ( suma, libro ) => suma + ( Number( libro.valor ) || 0 ), 0 );

    return html`
      ${ pageHeader({
        eyebrow: 'Existencias',
        title: 'Inventario',
        description: 'Revisa el valor del stock, los ejemplares disponibles y las alertas de reposición.',
        actions: html`
          <button type="button" class="btn btn-ghost" data-export-inventory>
            ${ icon( 'download', 17 ) } Exportar CSV
          </button>
        `
      }) }

      <section class="stats-grid" aria-label="Indicadores del inventario">
        ${ statCard({ label: 'Títulos', value: formatNumber( inventario.totalTitulos ), hint: 'Referencias en catálogo', iconName: 'book', tone: 'primary' }) }
        ${ statCard({ label: 'Ejemplares', value: formatNumber( inventario.totalEjemplares ), hint: 'Unidades disponibles', iconName: 'package', tone: 'teal' }) }
        ${ statCard({ label: 'Valor total', value: formatCurrency( inventario.valorInventario ), hint: 'Valorizado a precio de venta', iconName: 'wallet', tone: 'amber' }) }
        ${ statCard({ label: 'Reposición', value: formatNumber( inventario.stockBajo.length ), hint: `${ formatCurrency( valorBajo ) } en stock bajo`, iconName: 'alert', tone: inventario.stockBajo.length ? 'rose' : 'primary' }) }
      </section>

      <section class="card">
        <div class="card-toolbar inventory-toolbar">
          <form class="threshold-form" data-threshold-form>
            <label for="minimo">Umbral de stock bajo</label>
            <div class="inline-control">
              <input id="minimo" type="number" name="minimo" min="0" step="1" value="${ minimo }">
              <button type="submit" class="btn btn-primary">Aplicar</button>
            </div>
          </form>
          <div class="threshold-chips" aria-label="Umbrales rápidos">
            ${ [ 0, 2, 5, 10 ].map( valor => html`
              <a class="chip ${ valor === minimo ? 'is-active' : '' }"
                 href="${ RUTAS.ADMIN_INVENTARIO }?minimo=${ valor }"
                 data-link>${ valor === 0 ? 'Sin stock' : `≤ ${ valor }` }</a>
            ` ) }
          </div>
          <p class="toolbar-meta">Se consideran libros con stock menor o igual a <strong>${ minimo }</strong>.</p>
        </div>

        ${ inventario.stockBajo.length === 0
          ? emptyState({
            iconName: 'check-circle',
            title: 'Sin alertas de reposición',
            message: `Ningún libro tiene ${ minimo } o menos ejemplares disponibles.`
          })
          : html`
            <div class="low-stock-strip">
              <span class="low-stock-icon">${ icon( 'alert', 20 ) }</span>
              <div>
                <strong>${ inventario.stockBajo.length } ${ inventario.stockBajo.length === 1 ? 'título requiere' : 'títulos requieren' } reposición</strong>
                <p>Revisa las existencias para no perder ventas ni préstamos.</p>
              </div>
              <span class="low-stock-value">${ formatCurrency( valorBajo ) }</span>
            </div>
          ` }
      </section>

      <section class="card">
        <header class="card-head">
          <div>
            <h2>Detalle del inventario</h2>
            <p>Todos los títulos con su stock, préstamos activos y valor.</p>
          </div>
          <div class="card-actions">
            <span class="header-chip">${ icon( 'boxes', 16 ) } ${ inventario.libros.length } títulos</span>
          </div>
        </header>

        ${ inventario.libros.length === 0
          ? emptyState({ iconName: 'boxes', title: 'Sin inventario', message: 'Agrega libros para comenzar a controlar existencias.' })
          : html`
            <div class="table-wrap">
              <table class="data-table inventory-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Título</th>
                    <th>Stock</th>
                    <th>Préstamos activos</th>
                    <th class="text-right">Valor</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${ inventario.libros.map( libro => html`
                    <tr class="${ Number( libro.stock ) <= minimo ? 'row-alert' : '' }">
                      <td><span class="mono">${ libro.codigo }</span></td>
                      <td>
                        <div class="cell-stack">
                          <strong>${ libro.titulo }</strong>
                          ${ Number( libro.prestamosActivos ) > 0 ? html`<span>${ libro.prestamosActivos } en préstamo</span>` : '' }
                        </div>
                      </td>
                      <td>
                        <div class="stock-meter">
                          <div class="stock-bar" style="--stock-pct: ${ Math.min( 100, ( Number( libro.stock ) || 0 ) * 10 ) }%">
                            <span></span>
                          </div>
                          <span>${ libro.stock }</span>
                        </div>
                      </td>
                      <td>${ libro.prestamosActivos }</td>
                      <td class="text-right">${ money( libro.valor ) }</td>
                      <td>${ stockBadge( libro.stock ) }</td>
                    </tr>
                  ` ) }
                </tbody>
              </table>
            </div>
          ` }
      </section>
    `;
  },

  mount( root, ctx ){
    root.querySelector( '[data-threshold-form]' )?.addEventListener( 'submit', evento => {
      evento.preventDefault();
      const valor = Number( new FormData( evento.currentTarget ).get( 'minimo' ) );
      const minimo = Number.isInteger( valor ) && valor >= 0 ? valor : LOW_STOCK_DEFAULT;
      ctx.navigate( `${ RUTAS.ADMIN_INVENTARIO }?minimo=${ minimo }` );
    });

    root.querySelector( '[data-export-inventory]' )?.addEventListener( 'click', () => {
      if( !inventarioActual ){
        ctx.toast( 'No hay datos de inventario para exportar.', { type: 'warning' } );
        return;
      }

      const filas = [
        [ 'Código', 'Título', 'Stock', 'Préstamos activos', 'Valor' ],
        ...inventarioActual.libros.map( libro => [
          libro.codigo,
          libro.titulo,
          libro.stock,
          libro.prestamosActivos,
          Number( libro.valor ).toFixed( 2 )
        ])
      ];

      descargarCsv( `inventario-${ new Date().toISOString().slice( 0, 10 ) }.csv`, filas );
      ctx.toast( 'El inventario se exportó en formato CSV.', { type: 'success' } );
    });
  }
};
