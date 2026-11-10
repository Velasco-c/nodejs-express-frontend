const LIMITE_CANTIDAD = 100;

export function createCarritoService({ storage = globalThis.localStorage, getUserId = () => 'anonimo' } = {} ){
  function clave(){
    const usuario = String( getUserId?.() ?? 'anonimo' );
    return `libreria.carrito.${ encodeURIComponent( usuario ) }`;
  }

  function items(){
    try {
      const datos = JSON.parse( storage?.getItem( clave() ) ?? '[]' );
      if( !Array.isArray( datos ) ) return [];
      return datos.filter( item => typeof item?.codigo === 'string' && Number.isInteger( item.cantidad ) && item.cantidad > 0 );
    }
    catch {
      return [];
    }
  }

  function guardar( nuevosItems ){
    try {
      storage?.setItem( clave(), JSON.stringify( nuevosItems ) );
    }
    catch {
      throw new Error( 'No se pudo guardar el carrito en este navegador' );
    }
    return nuevosItems;
  }

  function agregar( codigo, cantidad = 1 ){
    const limpio = String( codigo ?? '' ).trim();
    if( !limpio || !Number.isInteger( cantidad ) || cantidad < 1 ) throw new Error( 'Libro o cantidad no válidos' );
    const actual = items();
    const existente = actual.find( item => item.codigo === limpio );
    if( existente ) existente.cantidad += cantidad;
    else actual.push({ codigo: limpio, cantidad });
    if( actual.some( item => item.cantidad > LIMITE_CANTIDAD ) ) throw new Error( `El máximo es ${ LIMITE_CANTIDAD } ejemplares por título` );
    return guardar( actual );
  }

  function cambiarCantidad( codigo, cantidad ){
    if( !Number.isInteger( cantidad ) || cantidad < 1 || cantidad > LIMITE_CANTIDAD ){
      throw new Error( `La cantidad debe estar entre 1 y ${ LIMITE_CANTIDAD }` );
    }
    return guardar( items().map( item => item.codigo === codigo ? { ...item, cantidad } : item ) );
  }

  function quitar( codigo ){
    return guardar( items().filter( item => item.codigo !== codigo ) );
  }

  function limpiar(){
    return guardar( [] );
  }

  return { items, agregar, cambiarCantidad, quitar, limpiar };
}
