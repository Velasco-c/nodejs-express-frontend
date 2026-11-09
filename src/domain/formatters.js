const DEFAULTS = { locale: 'es-GT', currency: 'GTQ' };
let formato = { ...DEFAULTS };

export function configureFormatters( opciones = {} ){
  formato = { ...DEFAULTS, ...opciones };
}

function numero( valor ){
  const n = Number( valor );
  return Number.isFinite( n ) ? n : 0;
}

export function formatCurrency( valor, opciones = {} ){
  const { locale, currency } = { ...formato, ...opciones };
  try {
    return new Intl.NumberFormat( locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format( numero( valor ) );
  }
  catch {
    return `Q${ numero( valor ).toFixed( 2 ) }`;
  }
}

export function formatNumber( valor, opciones = {} ){
  const { locale } = { ...formato, ...opciones };
  try {
    return new Intl.NumberFormat( locale ).format( numero( valor ) );
  }
  catch {
    return String( numero( valor ) );
  }
}

export function formatDate( valor, opciones = {} ){
  if( !valor ) return '—';
  const { locale } = { ...formato, ...opciones };
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test( String( valor ) )
    ? new Date( `${ valor }T12:00:00` )
    : new Date( valor );

  if( Number.isNaN( fecha.getTime() ) ) return String( valor );

  try {
    return new Intl.DateTimeFormat( locale, { day: '2-digit', month: 'short', year: 'numeric' } ).format( fecha );
  }
  catch {
    return String( valor );
  }
}

export function formatDateShort( valor, opciones = {} ){
  if( !valor ) return '—';
  const { locale } = { ...formato, ...opciones };
  const fecha = new Date( `${ valor }T12:00:00` );
  if( Number.isNaN( fecha.getTime() ) ) return String( valor );
  try {
    return new Intl.DateTimeFormat( locale, { day: '2-digit', month: '2-digit', year: 'numeric' } ).format( fecha );
  }
  catch {
    return String( valor );
  }
}

export function initials( nombre = '' ){
  const partes = String( nombre ).trim().split( /\s+/ ).filter( Boolean );
  if( partes.length === 0 ) return '?';
  if( partes.length === 1 ) return partes[0].slice( 0, 2 ).toUpperCase();
  return `${ partes[0][0] }${ partes[partes.length - 1][0] }`.toUpperCase();
}

export function truncate( texto, maximo = 60 ){
  const valor = String( texto ?? '' );
  return valor.length <= maximo ? valor : `${ valor.slice( 0, maximo - 1 ).trimEnd() }…`;
}

export function pluralizar( cantidad, singular, plural ){
  return Number( cantidad ) === 1 ? singular : plural;
}

export function classNames( ...valores ){
  return valores.flat().filter( Boolean ).join( ' ' );
}

export function hoyISO(){
  return new Date().toISOString().slice( 0, 10 );
}

export function totalPaginas( total, limite ){
  const registros = Number( total ) || 0;
  const porPagina = Number( limite ) || 1;
  return Math.max( 1, Math.ceil( registros / porPagina ) );
}

export function rangoPagina( pagina, total, limite ){
  const actual = Math.max( 1, Number( pagina ) || 1 );
  const paginas = totalPaginas( total, limite );
  const inicio = Math.max( 1, Math.min( actual - 2, paginas - 4 ) );
  const fin = Math.min( paginas, inicio + 4 );
  return Array.from( { length: fin - inicio + 1 }, ( _, i ) => inicio + i );
}
