import { html } from '../utils/html.js';
import { emptyState, loanBadge, pageHeader, pagination } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { formatDate } from '../../domain/formatters.js';
import { RUTAS } from '../../domain/constants.js';

export const historialPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const limite = ctx.config.pageSize;
    const resultado = await ctx.services.prestamos.historial({ pagina, limite });
    const activos = resultado.items.filter( prestamo => !prestamo.fechaDevolucion ).length;

    return html`
      ${ pageHeader({
        eyebrow: 'Mi historial',
        title: 'Mis préstamos',
        description: 'Consulta los libros que has solicitado y el estado de cada devolución.',
        actions: html`
          <a href="${ RUTAS.CATALOGO }" data-link class="btn btn-ghost">
            ${ icon( 'library', 17 ) } Ir al catálogo
          </a>
        `
      }) }

      <section class="stats-grid stats-grid-3">
        ${ html`
          <article class="stat-card stat-primary">
            <div class="stat-icon">${ icon( 'repeat', 22 ) }</div>
            <div class="stat-copy">
              <span class="stat-label">Préstamos totales</span>
              <strong class="stat-value">${ resultado.total }</strong>
              <span class="stat-hint">En tu historial</span>
            </div>
          </article>
          <article class="stat-card stat-amber">
            <div class="stat-icon">${ icon( 'clock', 22 ) }</div>
            <div class="stat-copy">
              <span class="stat-label">Activos en esta página</span>
              <strong class="stat-value">${ activos }</strong>
              <span class="stat-hint">Pendientes de devolver</span>
            </div>
          </article>
          <article class="stat-card stat-teal">
            <div class="stat-icon">${ icon( 'check-circle', 22 ) }</div>
            <div class="stat-copy">
              <span class="stat-label">Devueltos en esta página</span>
              <strong class="stat-value">${ resultado.items.length - activos }</strong>
              <span class="stat-hint">Movimientos completados</span>
            </div>
          </article>
        ` }
      </section>

      <section class="card">
        ${ resultado.items.length === 0
          ? emptyState({
            iconName: 'repeat',
            title: 'Aún no tienes préstamos',
            message: 'Cuando solicites un libro, el movimiento aparecerá en tu historial.',
            action: html`<a href="${ RUTAS.CATALOGO }" data-link class="btn btn-primary">${ icon( 'book-open', 17 ) } Explorar catálogo</a>`
          })
          : html`
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Préstamo</th>
                    <th>Libro</th>
                    <th>Fecha del préstamo</th>
                    <th>Devolución prevista</th>
                    <th>Fecha de devolución</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${ resultado.items.map( prestamo => html`
                    <tr>
                      <td><span class="mono">${ prestamo.id }</span></td>
                      <td><span class="mono">${ prestamo.codigoLibro }</span></td>
                      <td>${ formatDate( prestamo.fechaPrestamo ) }</td>
                      <td>${ formatDate( prestamo.fechaTentativaDevolucion ) }</td>
                      <td>${ prestamo.fechaDevolucion ? formatDate( prestamo.fechaDevolucion ) : '—' }</td>
                      <td>${ loanBadge( prestamo ) }</td>
                    </tr>
                  ` ) }
                </tbody>
              </table>
            </div>
          ` }

        ${ pagination({ total: resultado.total, pagina, limite, basePath: RUTAS.MIS_PRESTAMOS }) }
      </section>
    `;
  }
};
