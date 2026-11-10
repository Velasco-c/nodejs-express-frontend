import { html } from '../utils/html.js';
import { bookCover, detailGrid, emptyState, money, pageHeader, pagination, searchBar, stockBadge } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { getErrorMessage } from '../../domain/errors.js';
import { RUTAS } from '../../domain/constants.js';
import { hoyISO } from '../../domain/formatters.js';

function fechaEnDias( dias ){
  const fecha = new Date();
  fecha.setDate( fecha.getDate() + dias );
  return fecha.toISOString().slice( 0, 10 );
}

function formularioSolicitud( libro ){
  return html`
    <form class="form-grid" data-loan-request-form>
      <p class="form-grid-full">La solicitud quedará pendiente hasta que administración la apruebe. El stock no se reserva mientras espera.</p>
      <div class="field form-grid-full">
        <label for="fechaTentativaDevolucion">Fecha tentativa de devolución</label>
        <input id="fechaTentativaDevolucion" name="fechaTentativaDevolucion" type="date" min="${ hoyISO() }" value="${ fechaEnDias( 14 ) }" required>
      </div>
      <footer class="modal-actions form-grid-full">
        <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn-primary" data-submit>${ icon( 'repeat', 17 ) } Enviar solicitud</button>
      </footer>
    </form>
  `;
}

function detalleLibro( libro ){
  return html`
    <div class="catalog-detail">
      ${ bookCover({ titulo: libro.titulo, autor: libro.autor }) }
      <div class="catalog-detail-copy">
        <span class="eyebrow">${ libro.codigo }</span>
        <h3>${ libro.titulo }</h3>
        <p class="catalog-detail-author">${ libro.autor }</p>
        <div class="catalog-detail-meta">
          ${ stockBadge( libro.stock ) }
          <span class="price-tag">${ money( libro.precio ) }</span>
        </div>
        ${ detailGrid([
          { label: 'Año', value: libro.anio ?? '—' },
          { label: 'Editorial', value: libro.editorial || '—' },
          { label: 'ISBN', value: libro.isbn || '—' },
          { label: 'Código', value: libro.codigo }
        ]) }
        <p class="info-note info-note-inline">
          ${ icon( 'info', 16 ) }
          ${ Number( libro.stock ) > 0
            ? html`<span>Este título está disponible en la librería.</span>`
            : html`<span>Este título no tiene ejemplares disponibles por ahora.</span>` }
        </p>
      </div>
    </div>
  `;
}

export const catalogoPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const q = String( ctx.query.q ?? '' ).trim();
    const limite = ctx.config.catalogPageSize;
    const resultado = q
      ? await ctx.services.libros.buscar({ q, pagina, limite })
      : await ctx.services.libros.listar({ pagina, limite });

    return html`
      ${ pageHeader({
        eyebrow: 'Catálogo',
        title: 'Explora la librería',
        description: 'Consulta los títulos disponibles, sus autores y precios.',
        actions: html`
          <span class="header-chip">${ icon( 'library', 17 ) } ${ resultado.total } ${ resultado.total === 1 ? 'título' : 'títulos' }</span>
          <a href="${ RUTAS.CARRITO }" data-link class="btn btn-primary">${ icon( 'cart', 17 ) } Carrito (${ ( ctx.services.carrito?.items?.() ?? [] ).reduce( ( total, item ) => total + item.cantidad, 0 ) })</a>
        `
      }) }

      <section class="catalog-toolbar card">
        ${ searchBar({
          value: q,
          placeholder: 'Buscar por título, autor o ISBN…',
          label: 'Buscar en el catálogo',
          buttonLabel: 'Buscar'
        }) }
        ${ q ? html`<p class="toolbar-meta">Resultados para <strong>“${ q }”</strong> · <a href="${ RUTAS.CATALOGO }" data-link class="link-subtle">Limpiar</a></p>` : '' }
      </section>

      ${ resultado.items.length === 0
        ? emptyState({
          iconName: q ? 'search' : 'book-open',
          title: q ? 'Sin coincidencias' : 'Catálogo vacío',
          message: q ? `No encontramos títulos que coincidan con “${ q }”.` : 'Aún no hay libros disponibles para consultar.'
        })
        : html`
          <section class="book-grid" aria-label="Libros disponibles">
            ${ resultado.items.map( libro => html`
              <article class="book-card">
                ${ bookCover({ titulo: libro.titulo, autor: libro.autor }) }
                <div class="book-card-body">
                  <div class="book-card-top">
                    <span class="mono book-code">${ libro.codigo }</span>
                    ${ stockBadge( libro.stock ) }
                  </div>
                  <h2>${ libro.titulo }</h2>
                  <p class="book-author">${ libro.autor }</p>
                  <p class="book-meta">${ libro.anio ?? 's. f.' }${ libro.editorial ? ` · ${ libro.editorial }` : '' }</p>
                  <div class="book-card-footer">
                    <span class="price-tag">${ money( libro.precio ) }</span>
                    <button type="button" class="btn btn-ghost btn-sm" data-book-code="${ libro.codigo }">
                      ${ icon( 'eye', 16 ) } Detalle
                    </button>
                  </div>
                  <div class="book-card-actions">
                    <button type="button" class="btn btn-primary btn-sm" data-add-cart="${ libro.codigo }" ${ Number( libro.stock ) < 1 ? 'disabled' : '' }>
                      ${ icon( 'cart', 15 ) } Al carrito
                    </button>
                    <button type="button" class="btn btn-ghost btn-sm" data-request-loan="${ libro.codigo }" ${ Number( libro.stock ) < 1 ? 'disabled' : '' }>
                      ${ icon( 'repeat', 15 ) } Solicitar préstamo
                    </button>
                  </div>
                </div>
              </article>
            ` ) }
          </section>
        ` }

      ${ pagination({
        total: resultado.total,
        pagina,
        limite,
        basePath: RUTAS.CATALOGO,
        query: q ? { q } : {}
      }) }
    `;
  },

  mount( root, ctx ){
    const contenedor = root.querySelector( '#contenido' ) ?? root;
    const formularioBusqueda = contenedor.querySelector( '[data-search-form]' );

    const manejarBusqueda = evento => {
      evento.preventDefault();
      const q = new FormData( formularioBusqueda ).get( 'q' )?.toString().trim();
      ctx.navigate( q ? `${ RUTAS.CATALOGO }?q=${ encodeURIComponent( q ) }` : RUTAS.CATALOGO );
    };
    formularioBusqueda?.addEventListener( 'submit', manejarBusqueda );

    const manejarClick = async evento => {
      const agregar = evento.target.closest( '[data-add-cart]' );
      if( agregar ){
        try {
          ctx.services.carrito.agregar( agregar.dataset.addCart );
          ctx.toast( 'Libro agregado al carrito.', { type: 'success', title: 'Carrito actualizado' } );
          await ctx.refresh();
        }
        catch( error ){
          ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo agregar' } );
        }
        return;
      }

      const solicitar = evento.target.closest( '[data-request-loan]' );
      if( solicitar ){
        const codigo = solicitar.dataset.requestLoan;
        openModal({
          title: 'Solicitar préstamo',
          subtitle: `Libro ${ codigo }`,
          content: formularioSolicitud(),
          size: 'sm',
          onMount( elemento, cerrar ){
            const form = elemento.querySelector( '[data-loan-request-form]' );
            form.addEventListener( 'submit', async submit => {
              submit.preventDefault();
              const boton = form.querySelector( '[data-submit]' );
              boton.disabled = true;
              try {
                await ctx.services.prestamos.solicitar({
                  codigoLibro: codigo,
                  fechaTentativaDevolucion: form.elements.fechaTentativaDevolucion.value
                });
                cerrar();
                ctx.toast( 'Administración revisará tu solicitud.', { type: 'success', title: 'Solicitud enviada' } );
              }
              catch( error ){
                boton.disabled = false;
                ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo solicitar el préstamo' } );
              }
            });
          }
        });
        return;
      }

      const boton = evento.target.closest( '[data-book-code]' );
      if( !boton ) return;

      try {
        const libro = await ctx.services.libros.obtener( boton.dataset.bookCode );
        openModal({
          title: 'Detalle del libro',
          subtitle: 'Información del catálogo',
          content: detalleLibro( libro ),
          size: 'md'
        });
      }
      catch( error ){
        ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo cargar el libro' } );
      }
    };

    contenedor.addEventListener( 'click', manejarClick );

    return () => {
      contenedor.removeEventListener( 'click', manejarClick );
      formularioBusqueda?.removeEventListener( 'submit', manejarBusqueda );
    };
  }
};
