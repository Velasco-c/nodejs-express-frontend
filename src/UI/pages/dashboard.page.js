import { html } from '../utils/html.js';
import { badge, card, emptyState, loanBadge, money, pageHeader, statCard, stockBadge } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { formatCurrency, formatDate, formatNumber } from '../../domain/formatters.js';
import { getErrorMessage } from '../../domain/errors.js';
import { RUTAS } from '../../domain/constants.js';

function saludo(){
  const hora = new Date().getHours();
  if( hora < 12 ) return 'Buenos días';
  if( hora < 19 ) return 'Buenas tardes';
  return 'Buenas noches';
}

export const dashboardPage = {
  async render( ctx ){
    const [inventarioResultado, prestamosResultado, ventasResultado] = await Promise.allSettled([
      ctx.services.inventario.resumen( 2 ),
      ctx.services.prestamos.listar({ pagina: 1, limite: 5 }),
      ctx.services.ventas.listar({ pagina: 1, limite: 5 })
    ]);

    if( inventarioResultado.status === 'rejected' ) throw inventarioResultado.reason;

    const inventario = inventarioResultado.value;
    const prestamos = prestamosResultado.status === 'fulfilled' ? prestamosResultado.value.items : [];
    const ventas = ventasResultado.status === 'fulfilled' ? ventasResultado.value.items : [];
    const nombre = ctx.session?.usuario?.nombre?.split( ' ' )[0] ?? '';

    return html`
      ${ pageHeader({
        eyebrow: 'Resumen general',
        title: `${ saludo() }, ${ nombre }`,
        description: 'Este es el estado actual del catálogo, los préstamos y las ventas.',
        actions: html`
          <button type="button" class="btn btn-ghost" data-refresh>
            ${ icon( 'refresh', 17 ) } Actualizar
          </button>
          <a class="btn btn-primary" href="${ RUTAS.ADMIN_VENTAS }" data-link>
            ${ icon( 'plus', 17 ) } Nueva venta
          </a>
        `
      }) }

      <section class="stats-grid" aria-label="Indicadores del inventario">
        ${ statCard({ label: 'Títulos registrados', value: formatNumber( inventario.totalTitulos ), hint: 'Libros en catálogo', iconName: 'book', tone: 'primary' }) }
        ${ statCard({ label: 'Ejemplares disponibles', value: formatNumber( inventario.totalEjemplares ), hint: 'Unidades en stock', iconName: 'boxes', tone: 'teal' }) }
        ${ statCard({ label: 'Valor del inventario', value: formatCurrency( inventario.valorInventario ), hint: 'Precio de venta actual', iconName: 'wallet', tone: 'amber' }) }
        ${ statCard({ label: 'Stock bajo', value: formatNumber( inventario.stockBajo.length ), hint: 'Títulos con 2 o menos', iconName: 'alert', tone: inventario.stockBajo.length > 0 ? 'rose' : 'primary' }) }
      </section>

      <div class="dashboard-grid">
        <div class="dashboard-main">
          ${ card({
            title: 'Préstamos recientes',
            subtitle: 'Últimos movimientos registrados',
            actions: html`<a class="link-arrow" href="${ RUTAS.ADMIN_PRESTAMOS }" data-link>Ver todos ${ icon( 'arrow-right', 15 ) }</a>`,
            body: prestamos.length === 0
              ? emptyState({ iconName: 'repeat', title: 'Sin préstamos', message: 'Todavía no se ha registrado ningún préstamo.' })
              : html`
                <div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Préstamo</th>
                        <th>Libro</th>
                        <th>Cliente</th>
                        <th>Devolución</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${ prestamos.map( prestamo => html`
                        <tr>
                          <td><span class="mono">${ prestamo.id }</span></td>
                          <td><span class="mono">${ prestamo.codigoLibro }</span></td>
                          <td>${ prestamo.identificacionUsuario }</td>
                          <td>${ formatDate( prestamo.fechaTentativaDevolucion ) }</td>
                          <td>${ loanBadge( prestamo ) }</td>
                        </tr>
                      ` ) }
                    </tbody>
                  </table>
                </div>
              `
          }) }

          ${ card({
            title: 'Ventas recientes',
            subtitle: 'Últimas transacciones del día',
            actions: html`<a class="link-arrow" href="${ RUTAS.ADMIN_VENTAS }" data-link>Ver todas ${ icon( 'arrow-right', 15 ) }</a>`,
            body: ventas.length === 0
              ? emptyState({ iconName: 'cart', title: 'Sin ventas', message: 'Las ventas registradas aparecerán aquí.' })
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
                      </tr>
                    </thead>
                    <tbody>
                      ${ ventas.map( venta => html`
                        <tr>
                          <td><span class="mono">${ venta.id }</span></td>
                          <td>${ venta.identificacionCliente }</td>
                          <td>${ formatDate( venta.fecha ) }</td>
                          <td>${ venta.items?.length ?? 0 }</td>
                          <td class="text-right">${ money( venta.total ) }</td>
                        </tr>
                      ` ) }
                    </tbody>
                  </table>
                </div>
              `
          }) }
        </div>

        <aside class="dashboard-side">
          ${ card({
            title: 'Stock bajo',
            subtitle: 'Títulos que requieren reposición',
            actions: html`<a class="link-arrow" href="${ RUTAS.ADMIN_INVENTARIO }" data-link>Inventario ${ icon( 'arrow-right', 15 ) }</a>`,
            className: 'card-compact',
            body: inventario.stockBajo.length === 0
              ? emptyState({ iconName: 'check-circle', title: 'Todo en orden', message: 'No hay títulos con stock bajo.' })
              : html`
                <ul class="stock-list">
                  ${ inventario.stockBajo.slice( 0, 8 ).map( libro => html`
                    <li>
                      <div class="stock-list-copy">
                        <strong>${ libro.titulo }</strong>
                        <span class="mono">${ libro.codigo }</span>
                      </div>
                      ${ stockBadge( libro.stock ) }
                    </li>
                  ` ) }
                </ul>
              `
          }) }

          ${ card({
            title: 'Accesos rápidos',
            className: 'card-compact',
            body: html`
              <div class="quick-actions">
                <a href="${ RUTAS.ADMIN_LIBROS }" data-link class="quick-action">
                  <span class="quick-icon">${ icon( 'book', 19 ) }</span>
                  <span><strong>Catálogo</strong><small>Gestionar libros</small></span>
                  ${ icon( 'chevron-right', 16 ) }
                </a>
                <a href="${ RUTAS.ADMIN_USUARIOS }" data-link class="quick-action">
                  <span class="quick-icon">${ icon( 'users', 19 ) }</span>
                  <span><strong>Clientes</strong><small>Consultar registros</small></span>
                  ${ icon( 'chevron-right', 16 ) }
                </a>
                <a href="${ RUTAS.ADMIN_PRESTAMOS }" data-link class="quick-action">
                  <span class="quick-icon">${ icon( 'repeat', 19 ) }</span>
                  <span><strong>Préstamos</strong><small>Registrar y devolver</small></span>
                  ${ icon( 'chevron-right', 16 ) }
                </a>
                <a href="${ RUTAS.ADMIN_INVENTARIO }" data-link class="quick-action">
                  <span class="quick-icon">${ icon( 'boxes', 19 ) }</span>
                  <span><strong>Inventario</strong><small>Revisar existencias</small></span>
                  ${ icon( 'chevron-right', 16 ) }
                </a>
              </div>
            `
          }) }
        </aside>
      </div>
    `;
  },

  mount( root, ctx ){
    root.querySelector( '[data-refresh]' )?.addEventListener( 'click', () => {
      ctx.refresh().catch( error => ctx.toast( getErrorMessage( error ), { type: 'error' } ) );
    });
  }
};
