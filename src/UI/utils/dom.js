export const qs = ( selector, raiz = document ) => raiz.querySelector( selector );
export const qsa = ( selector, raiz = document ) => Array.from( raiz.querySelectorAll( selector ) );

export function on( raiz, evento, selector, manejador ){
  const listener = event => {
    const objetivo = event.target.closest( selector );
    if( objetivo && raiz.contains( objetivo ) ) manejador( event, objetivo );
  };
  raiz.addEventListener( evento, listener );
  return () => raiz.removeEventListener( evento, listener );
}

export function datosFormulario( formulario ){
  const datos = {};
  const formData = new FormData( formulario );
  for( const [ clave, valor ] of formData.entries() ){
    datos[clave] = typeof valor === 'string' ? valor : valor;
  }
  return datos;
}

export function enfocarPrimero( contenedor ){
  const elemento = contenedor?.querySelector( 'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])' );
  elemento?.focus();
}

export function desplazarArriba(){
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function bloquearBoton( boton, bloqueado, textoCargando = 'Guardando…' ){
  if( !boton ) return;
  if( bloqueado ){
    boton.dataset.textoOriginal = boton.innerHTML;
    boton.disabled = true;
    boton.classList.add( 'is-loading' );
    boton.innerHTML = `<span class="spinner spinner-sm" aria-hidden="true"></span>${ textoCargando }`;
  }
  else {
    boton.disabled = false;
    boton.classList.remove( 'is-loading' );
    if( boton.dataset.textoOriginal ) boton.innerHTML = boton.dataset.textoOriginal;
  }
}

export function mostrarErroresFormulario( formulario, errores = {} ){
  for( const elemento of formulario.querySelectorAll( '.field-error' ) ) elemento.textContent = '';
  for( const elemento of formulario.querySelectorAll( '.is-invalid' ) ) elemento.classList.remove( 'is-invalid' );

  for( const [ campo, mensaje ] of Object.entries( errores ) ){
    const input = formulario.querySelector( `[name="${ CSS.escape( campo ) }"]` );
    if( input ){
      input.classList.add( 'is-invalid' );
      const contenedor = input.closest( '.field' );
      const error = contenedor?.querySelector( '.field-error' );
      if( error ) error.textContent = mensaje;
    }
  }

  const primero = formulario.querySelector( '.is-invalid' );
  primero?.focus();
}

export function limpiarErroresFormulario( formulario ){
  for( const elemento of formulario.querySelectorAll( '.field-error' ) ) elemento.textContent = '';
  for( const elemento of formulario.querySelectorAll( '.is-invalid' ) ) elemento.classList.remove( 'is-invalid' );
}

export function debounce( funcion, espera = 300 ){
  let temporizador;
  return ( ...args ) => {
    clearTimeout( temporizador );
    temporizador = setTimeout( () => funcion( ...args ), espera );
  };
}

export function descargarCsv( nombre, filas ){
  const contenido = filas
    .map( fila => fila.map( valor => `"${ String( valor ?? '' ).replace( /"/g, '""' ) }"` ).join( ',' ) )
    .join( '\r\n' );
  const blob = new Blob( [ `\uFEFF${ contenido }` ], { type: 'text/csv;charset=utf-8;' } );
  const url = URL.createObjectURL( blob );
  const enlace = document.createElement( 'a' );
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL( url );
}
