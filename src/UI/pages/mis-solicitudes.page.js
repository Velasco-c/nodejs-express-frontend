import { html } from '../utils/html.js';
import { badge, emptyState, pageHeader, pagination } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { formatDate } from '../../domain/formatters.js';
import { RUTAS } from '../../domain/constants.js';

const estado = valor => badge(
  valor === 'aprobada' ? 'Aprobada' : valor === 'rechazada' ? 'Rechazada' : 'Pendiente de aprobación',
  valor === 'aprobada' ? 'success' : valor === 'rechazada' ? 'danger' : 'warning'
);

export const misSolicitudesPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const limite = ctx.config.pageSize;
    const resultado = await ctx.services.prestamos.misSolicitudes({ pagina, limite });
    return html`
      ${ pageHeader({
        eyebrow: 'Mi cuenta', title: 'Solicitudes de préstamo',
        description: 'Administración revisará cada solicitud. El stock se descuenta al aprobarla.',
        actions: html`<a href="${ RUTAS.CATALOGO }" data-link class="btn btn-ghost">${ icon( 'library', 17 ) } Ver catálogo</a>`
      }) }
      <section class="card">
        ${ resultado.items.length === 0
          ? emptyState({
            iconName: 'repeat', title: 'No tienes solicitudes',
            message: 'Desde el catálogo puedes pedir prestado un libro disponible.',
            action: html`<a href="${ RUTAS.CATALOGO }" data-link class="btn btn-primary">Explorar libros</a>`
          })
          : html`
            <div class="table-wrap"><table class="data-table">
              <thead><tr><th>Solicitud</th><th>Libro</th><th>Enviada</th><th>Devolución tentativa</th><th>Estado</th><th>Préstamo</th></tr></thead>
              <tbody>${ resultado.items.map( solicitud => html`
                <tr>
                  <td><span class="mono">${ solicitud.id }</span></td>
                  <td><div class="cell-stack"><strong>${ solicitud.titulo ?? solicitud.codigoLibro }</strong><span class="mono">${ solicitud.codigoLibro }</span></div></td>
                  <td>${ formatDate( solicitud.fechaSolicitud ) }</td>
                  <td>${ formatDate( solicitud.fechaTentativaDevolucion ) }</td>
                  <td>${ estado( solicitud.estado ) }</td>
                  <td>${ solicitud.prestamoId ? html`<a class="link-subtle" data-link href="${ RUTAS.MIS_PRESTAMOS }">${ solicitud.prestamoId }</a>` : '—' }</td>
                </tr>
              ` ) }</tbody>
            </table></div>
          ` }
        ${ pagination({ total: resultado.total, pagina, limite, basePath: RUTAS.MIS_SOLICITUDES }) }
      </section>
    `;
  }
};
