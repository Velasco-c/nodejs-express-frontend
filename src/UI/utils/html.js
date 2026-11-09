const MARCA_HTML = Symbol( 'HtmlSeguro' );

export class HtmlSeguro {
  constructor( valor ){
    this.valor = String( valor ?? '' );
  }

  toString(){
    return this.valor;
  }
}

export function raw( valor ){
  return valor instanceof HtmlSeguro ? valor : new HtmlSeguro( valor );
}

const ENTIDADES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml( valor ){
  return String( valor ?? '' ).replace( /[&<>"']/g, caracter => ENTIDADES[caracter] );
}

function formatearValor( valor ){
  if( valor === null || valor === undefined || valor === false ) return '';
  if( valor instanceof HtmlSeguro ) return valor.valor;
  if( Array.isArray( valor ) ) return valor.map( formatearValor ).join( '' );
  return escapeHtml( valor );
}

/**
 * Template literal que escapa automáticamente los valores interpolados.
 * Usa `raw()` solo para fragmentos construidos por la propia aplicación.
 */
export function html( cadenas, ...valores ){
  let resultado = '';
  cadenas.forEach( ( cadena, indice ) => {
    resultado += cadena;
    if( indice < valores.length ) resultado += formatearValor( valores[indice] );
  });
  return new HtmlSeguro( resultado );
}

export const render = valor => ( valor instanceof HtmlSeguro ? valor.toString() : escapeHtml( valor ) );
