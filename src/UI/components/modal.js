import { HtmlSeguro, html, raw, render } from '../utils/html.js';
import { enfocarPrimero } from '../utils/dom.js';
import { icon } from './icons.js';

function crearDialogo( contenido, { clase = '', etiqueta = 'Diálogo' } = {} ){
  const dialogo = document.createElement( 'dialog' );
  dialogo.className = `modal ${ clase }`.trim();
  dialogo.setAttribute( 'aria-label', etiqueta );
  dialogo.innerHTML = render( contenido );
  document.body.append( dialogo );
  return dialogo;
}

function abrirDialogo( dialogo ){
  if( typeof dialogo.showModal === 'function' ) dialogo.showModal();
  else dialogo.setAttribute( 'open', '' );
  requestAnimationFrame( () => {
    const automatico = dialogo.querySelector( '[autofocus]' );
    if( automatico ) automatico.focus();
    else enfocarPrimero( dialogo );
  });
}

export function openModal({
  title,
  subtitle = null,
  content,
  size = 'md',
  onMount = null,
  closeOnBackdrop = true,
  label = null
} = {}){
  const cuerpo = html`
    <div class="modal-panel modal-${ size }">
      <header class="modal-head">
        <div>
          <h2>${ title }</h2>
          ${ subtitle ? html`<p>${ subtitle }</p>` : '' }
        </div>
        <button type="button" class="icon-btn modal-close" aria-label="Cerrar" data-close>${ icon( 'x', 20 ) }</button>
      </header>
      <div class="modal-body">${ content }</div>
    </div>
  `;

  const dialogo = crearDialogo( cuerpo, { etiqueta: label ?? title ?? 'Diálogo' } );
  let cerrado = false;

  const cerrar = ( valor = null ) => {
    if( cerrado ) return;
    cerrado = true;
    if( typeof dialogo.close === 'function' ) dialogo.close( valor );
    else {
      dialogo.removeAttribute( 'open' );
      dialogo.remove();
    }
  };

  dialogo.addEventListener( 'click', evento => {
    if( evento.target === dialogo && closeOnBackdrop ) cerrar();
  });

  dialogo.querySelector( '[data-close]' )?.addEventListener( 'click', () => cerrar() );

  dialogo.addEventListener( 'close', () => {
    dialogo.remove();
  }, { once: true } );

  abrirDialogo( dialogo );
  onMount?.( dialogo, cerrar );

  return { dialog: dialogo, close: cerrar };
}

export function confirmAction({
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger'
} = {}){
  return new Promise( resolver => {
    let decidido = false;

    const contenido = html`
      <div class="confirm-body">
        <span class="confirm-icon confirm-${ tone }">${ icon( tone === 'danger' ? 'alert' : 'info', 24 ) }</span>
        <div class="confirm-message">${ message instanceof HtmlSeguro ? message : html`<p>${ message }</p>` }</div>
      </div>
      <footer class="modal-actions">
        <button type="button" class="btn btn-ghost" data-cancel>${ cancelLabel }</button>
        <button type="button" class="btn ${ tone === 'danger' ? 'btn-danger' : 'btn-primary' }" data-confirm>${ confirmLabel }</button>
      </footer>
    `;

    const { dialog } = openModal({
      title,
      content: contenido,
      size: 'sm',
      onMount( elemento, cerrarModal ){
        elemento.querySelector( '[data-cancel]' )?.addEventListener( 'click', () => {
          decidido = true;
          cerrarModal( false );
          resolver( false );
        });
        elemento.querySelector( '[data-confirm]' )?.addEventListener( 'click', () => {
          decidido = true;
          cerrarModal( true );
          resolver( true );
        });
        elemento.addEventListener( 'close', () => {
          if( !decidido ) resolver( false );
        });
      }
    });

    dialog.addEventListener( 'cancel', () => {
      if( !decidido ) resolver( false );
      decidido = true;
    });
  });
}

export { raw };
