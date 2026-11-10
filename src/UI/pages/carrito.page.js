import { html } from '../utils/html.js';
import { emptyState, money, pageHeader } from '../components/ui.js';
import { icon } from '../components/icons.js';
import { bloquearBoton } from '../utils/dom.js';
import { getErrorMessage } from '../../domain/errors.js';
import { formatCurrency } from '../../domain/formatters.js';
import { RUTAS } from '../../domain/constants.js';

export const carritoPage = {
  async render( ctx ){
    const carrito = ctx.services.carrito.items();
    const lineas = await Promise.all( carrito.map( async item => {
      try {
        return { ...item, libro: await ctx.services.libros.obtener( item.codigo ) };
      }
      catch {
        return { ...item, libro: null };
      }
    }));
    const estimado = lineas.reduce( ( total, item ) => total + ( Number( item.libro?.precio ) || 0 ) * item.cantidad, 0 );
    const puedeEnviar = lineas.length > 0 && lineas.every( item => item.libro && item.libro.stock >= item.cantidad );

    return html`
      ${ pageHeader({
        eyebrow: 'Compra',
        title: 'Tu carrito',
        description: 'Envía tu pedido para que administración confirme disponibilidad y entrega.',
        actions: html`<a href="${ RUTAS.CATALOGO }" data-link class="btn btn-ghost">${ icon( 'library', 17 ) } Seguir explorando</a>`
      }) }

      <section class="card cart-card">
        ${ lineas.length === 0
          ? emptyState({
            iconName: 'cart',
            title: 'Tu carrito está vacío',
            message: 'Agrega libros del catálogo para preparar un pedido.',
            action: html`<a href="${ RUTAS.CATALOGO }" data-link class="btn btn-primary">${ icon( 'book-open', 17 ) } Ver catálogo</a>`
          })
          : html`
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Libro</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>
                <tbody>
                  ${ lineas.map( item => html`
                    <tr>
                      <td><div class="cell-stack"><strong>${ item.libro?.titulo ?? 'Libro no disponible' }</strong><span class="mono">${ item.codigo }</span></div></td>
                      <td>${ item.libro ? money( item.libro.precio ) : '—' }</td>
                      <td>
                        ${ item.libro
                          ? html`<div class="cart-quantity">
                              <button type="button" class="icon-btn" data-quantity-change="-1" data-cart-code="${ item.codigo }" aria-label="Reducir cantidad">−</button>
                              <span>${ item.cantidad }</span>
                              <button type="button" class="icon-btn" data-quantity-change="1" data-cart-code="${ item.codigo }" aria-label="Aumentar cantidad" ${ item.cantidad >= Math.min( item.libro.stock, 100 ) ? 'disabled' : '' }>+</button>
                            </div>`
                          : '—' }
                      </td>
                      <td>${ item.libro ? money( item.libro.precio * item.cantidad ) : '—' }</td>
                      <td><button type="button" class="btn btn-ghost btn-sm" data-remove-cart="${ item.codigo }">Quitar</button></td>
                    </tr>
                    ${ item.libro && item.libro.stock < item.cantidad
                      ? html`<tr><td colspan="5"><span class="field-help">Solo hay ${ item.libro.stock } ejemplares disponibles; ajusta la cantidad para continuar.</span></td></tr>`
                      : '' }
                  ` ) }
                </tbody>
              </table>
            </div>

            <div class="cart-checkout">
              <p>Estimado: <strong>${ formatCurrency( estimado ) }</strong></p>
              <p class="field-help">El precio se mantiene como cotización del pedido. No se cobra en línea.</p>
              <button type="button" class="btn btn-primary" data-place-order ${ puedeEnviar ? '' : 'disabled' }>
                ${ icon( 'shopping-bag', 17 ) } Enviar pedido
              </button>
            </div>
          ` }
      </section>
    `;
  },

  mount( root, ctx ){
    const contenedor = root.querySelector( '#contenido' ) ?? root;
    const manejarClick = async evento => {
      const cambiar = evento.target.closest( '[data-quantity-change]' );
      const quitar = evento.target.closest( '[data-remove-cart]' );
      if( cambiar ){
        const actual = ctx.services.carrito.items().find( item => item.codigo === cambiar.dataset.cartCode );
        try {
          if( actual ) ctx.services.carrito.cambiarCantidad( actual.codigo, actual.cantidad + Number( cambiar.dataset.quantityChange ) );
          await ctx.refresh();
        }
        catch( error ){
          ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo cambiar la cantidad' } );
        }
        return;
      }
      if( quitar ){
        ctx.services.carrito.quitar( quitar.dataset.removeCart );
        await ctx.refresh();
        return;
      }

      const enviar = evento.target.closest( '[data-place-order]' );
      if( !enviar ) return;
      bloquearBoton( enviar, true, 'Enviando pedido…' );
      try {
        const pedido = await ctx.services.ventas.crearPedido({ libros: ctx.services.carrito.items() });
        ctx.services.carrito.limpiar();
        ctx.toast( `Pedido ${ pedido.id } enviado; queda pendiente de confirmación administrativa.`, {
          type: 'success', title: 'Pedido recibido'
        });
        ctx.navigate( RUTAS.MIS_PEDIDOS );
      }
      catch( error ){
        bloquearBoton( enviar, false );
        ctx.toast( getErrorMessage( error ), { type: 'error', title: 'No se pudo enviar el pedido' } );
      }
    };
    contenedor.addEventListener( 'click', manejarClick );
    return () => contenedor.removeEventListener( 'click', manejarClick );
  }
};
