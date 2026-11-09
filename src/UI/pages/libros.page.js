import { html } from '../utils/html.js';
import { emptyState, field, money, pageHeader, pagination, searchBar, stockBadge } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { openModal } from '../components/modal.js';
import { bloquearBoton, datosFormulario, mostrarErroresFormulario } from '../utils/dom.js';
import { ValidationError, getErrorMessage } from '../../domain/errors.js';
import { RUTAS } from '../../domain/constants.js';

function formularioLibro( libro = null ){
  const editando = Boolean( libro );
  return html`
    <form class="form-grid" data-book-form novalidate>
      ${ field({
        label: 'Código',
        name: 'codigo',
        value: libro?.codigo ?? '',
        placeholder: 'Ej. L052',
        required: !editando,
        readonly: editando,
        help: editando ? 'El código no se puede modificar.' : 'Identificador único del libro.'
      }) }
      ${ field({ label: 'Título', name: 'titulo', value: libro?.titulo ?? '', placeholder: 'Título de la obra', required: true }) }
      ${ field({ label: 'Autor', name: 'autor', value: libro?.autor ?? '', placeholder: 'Nombre del autor', required: true }) }
      ${ field({ label: 'ISBN', name: 'isbn', value: libro?.isbn ?? '', placeholder: '978…' }) }
      ${ field({ label: 'Año', name: 'anio', type: 'number', value: libro?.anio ?? '', placeholder: '1967', min: 0, step: 1 }) }
      ${ field({ label: 'Editorial', name: 'editorial', value: libro?.editorial ?? '', placeholder: 'Editorial' }) }
      ${ field({ label: 'Precio', name: 'precio', type: 'number', value: libro?.precio ?? 0, min: 0, step: '0.01', placeholder: '0.00' }) }
      ${ field({ label: 'Stock', name: 'stock', type: 'number', value: libro?.stock ?? 0, min: 0, step: 1, placeholder: '0' }) }

      <p class="form-alert form-grid-full" data-form-error role="alert" hidden></p>

      <footer class="modal-actions form-grid-full">
        <button type="button" class="btn btn-ghost" data-close>Cancelar</button>
        <button type="submit" class="btn btn-primary" data-submit>
          ${ icon( editando ? 'check' : 'plus', 17 ) } ${ editando ? 'Guardar cambios' : 'Crear libro' }
        </button>
      </footer>
    </form>
  `;
}

function abrirFormulario( ctx, libro = null ){
  const editando = Boolean( libro );
  const { dialog } = openModal({
    title: editando ? 'Editar libro' : 'Nuevo libro',
    subtitle: editando ? `${ libro.titulo } · ${ libro.codigo }` : 'Agrega un título al catálogo de la librería.',
    content: formularioLibro( libro ),
    size: 'lg',
    onMount( elemento, cerrar ){
      const formulario = elemento.querySelector( '[data-book-form]' );
      const boton = formulario.querySelector( '[data-submit]' );
      const errorBox = formulario.querySelector( '[data-form-error]' );

      elemento.querySelector( '[data-close]' )?.addEventListener( 'click', cerrar );

      formulario.addEventListener( 'submit', async evento => {
        evento.preventDefault();
        errorBox.hidden = true;
        bloquearBoton( boton, true, editando ? 'Guardando…' : 'Creando…' );

        try {
          const datos = datosFormulario( formulario );
          if( editando ) await ctx.services.libros.actualizar( libro.codigo, datos );
          else await ctx.services.libros.crear( datos );

          ctx.toast( editando ? 'Los cambios del libro se guardaron.' : 'El libro se agregó al catálogo.', {
            type: 'success',
            title: editando ? 'Libro actualizado' : 'Libro creado'
          });
          cerrar();
          await ctx.refresh();
        }
        catch( error ){
          if( error instanceof ValidationError ) mostrarErroresFormulario( formulario, error.errors );
          else {
            errorBox.textContent = getErrorMessage( error );
            errorBox.hidden = false;
          }
          ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo guardar el libro' } );
        }
        finally {
          bloquearBoton( boton, false );
        }
      });
    }
  });

  return dialog;
}

export const librosPage = {
  async render( ctx ){
    const pagina = Math.max( 1, Number( ctx.query.pagina ) || 1 );
    const q = String( ctx.query.q ?? '' ).trim();
    const limite = ctx.config.pageSize;
    const resultado = q
      ? await ctx.services.libros.buscar({ q, pagina, limite })
      : await ctx.services.libros.listar({ pagina, limite });

    return html`
      ${ pageHeader({
        eyebrow: 'Catálogo',
        title: 'Libros',
        description: 'Administra los títulos, precios y existencias de la librería.',
        actions: html`
          <button type="button" class="btn btn-primary" data-new-book>
            ${ icon( 'plus', 18 ) } Nuevo libro
          </button>
        `
      }) }

      <section class="card">
        <div class="card-toolbar">
          ${ searchBar({
            value: q,
            placeholder: 'Buscar por título, autor o ISBN…',
            label: 'Buscar libros',
            buttonLabel: 'Buscar'
          }) }
          <div class="toolbar-meta">
            <span>${ q ? html`Resultados para <strong>“${ q }”</strong>` : 'Todos los libros' }</span>
            ${ q ? html`<a href="${ RUTAS.ADMIN_LIBROS }" data-link class="link-subtle">Limpiar búsqueda</a>` : '' }
            <span class="toolbar-count">${ resultado.total } ${ resultado.total === 1 ? 'libro' : 'libros' }</span>
          </div>
        </div>

        ${ resultado.items.length === 0
          ? emptyState({
            iconName: q ? 'search' : 'book-open',
            title: q ? 'Sin coincidencias' : 'El catálogo está vacío',
            message: q ? `No encontramos libros que coincidan con “${ q }”.` : 'Agrega el primer libro para comenzar.',
            action: html`<button type="button" class="btn btn-primary" data-new-book>${ icon( 'plus', 17 ) } Nuevo libro</button>`
          })
          : html`
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Libro</th>
                    <th>Año</th>
                    <th>Editorial</th>
                    <th class="text-right">Precio</th>
                    <th>Stock</th>
                    <th class="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${ resultado.items.map( libro => html`
                    <tr data-book-row="${ libro.codigo }">
                      <td><span class="mono">${ libro.codigo }</span></td>
                      <td>
                        <div class="cell-stack">
                          <strong>${ libro.titulo }</strong>
                          <span>${ libro.autor }${ libro.isbn ? ` · ${ libro.isbn }` : '' }</span>
                        </div>
                      </td>
                      <td>${ libro.anio ?? '—' }</td>
                      <td>${ libro.editorial || '—' }</td>
                      <td class="text-right">${ money( libro.precio ) }</td>
                      <td>${ stockBadge( libro.stock ) }</td>
                      <td>
                        <div class="row-actions">
                          <button type="button" class="icon-btn" data-edit-book="${ libro.codigo }" aria-label="Editar ${ libro.titulo }" title="Editar">
                            ${ icon( 'pencil', 17 ) }
                          </button>
                          <button type="button" class="icon-btn icon-btn-danger" data-delete-book="${ libro.codigo }" aria-label="Eliminar ${ libro.titulo }" title="Eliminar">
                            ${ icon( 'trash', 17 ) }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ` ) }
                </tbody>
              </table>
            </div>
          ` }

        ${ pagination({
          total: resultado.total,
          pagina,
          limite,
          basePath: RUTAS.ADMIN_LIBROS,
          query: q ? { q } : {}
        }) }
      </section>
    `;
  },

  mount( root, ctx ){
    const contenedor = root.querySelector( '#contenido' ) ?? root;

    const manejarClick = async evento => {
      const nuevo = evento.target.closest( '[data-new-book]' );
      if( nuevo ){
        abrirFormulario( ctx );
        return;
      }

      const editar = evento.target.closest( '[data-edit-book]' );
      if( editar ){
        const codigo = editar.dataset.editBook;
        try {
          const libro = await ctx.services.libros.obtener( codigo );
          abrirFormulario( ctx, libro );
        }
        catch( error ){
          ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo abrir el libro' } );
        }
        return;
      }

      const eliminar = evento.target.closest( '[data-delete-book]' );
      if( eliminar ){
        const codigo = eliminar.dataset.deleteBook;
        const fila = eliminar.closest( 'tr' );
        const titulo = fila?.querySelector( '.cell-stack strong' )?.textContent ?? codigo;
        const confirmado = await ctx.confirm({
          title: 'Eliminar libro',
          message: html`¿Seguro que deseas eliminar <strong>${ titulo }</strong>? Esta acción no se puede deshacer.`,
          confirmLabel: 'Eliminar',
          tone: 'danger'
        });
        if( !confirmado ) return;

        try {
          bloquearBoton( eliminar, true, '' );
          await ctx.services.libros.eliminar( codigo );
          ctx.toast( 'El libro se eliminó del catálogo.', { type: 'success', title: 'Libro eliminado' } );
          await ctx.refresh();
        }
        catch( error ){
          bloquearBoton( eliminar, false );
          ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo eliminar' } );
        }
      }
    };

    contenedor.addEventListener( 'click', manejarClick );

    const formularioBusqueda = contenedor.querySelector( '[data-search-form]' );
    const manejarBusqueda = evento => {
      evento.preventDefault();
      const q = new FormData( formularioBusqueda ).get( 'q' )?.toString().trim();
      ctx.navigate( q ? `${ RUTAS.ADMIN_LIBROS }?q=${ encodeURIComponent( q ) }` : RUTAS.ADMIN_LIBROS );
    };
    formularioBusqueda?.addEventListener( 'submit', manejarBusqueda );

    return () => {
      contenedor.removeEventListener( 'click', manejarClick );
      formularioBusqueda?.removeEventListener( 'submit', manejarBusqueda );
    };
  }
};
