import { html } from '../utils/html.js';
import { bookCover, detailGrid, emptyState, money, pageHeader, pagination, searchBar, stockBadge } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { getErrorMessage } from '../../domain/errors.js';
import { RUTAS } from '../../domain/constants.js';

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
        actions: html`<span class="header-chip">${ icon( 'library', 17 ) } ${ resultado.total } ${ resultado.total === 1 ? 'título' : 'títulos' }</span>`
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
                      ${ icon( 'eye', 16 ) } Ver detalle
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
