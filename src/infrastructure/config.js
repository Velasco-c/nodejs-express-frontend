const runtime = globalThis.__APP_CONFIG__ ?? {};

function limpiarBaseUrl( valor ){
  const texto = String( valor ?? '' ).trim();
  return texto.endsWith( '/' ) ? texto.slice( 0, -1 ) : texto;
}

export const config = Object.freeze({
  appName: runtime.appName || 'Librería',
  apiBaseUrl: limpiarBaseUrl( runtime.apiBaseUrl ),
  locale: runtime.locale || 'es-GT',
  currency: runtime.currency || 'GTQ',
  pageSize: Number( runtime.pageSize ) || 10,
  catalogPageSize: Number( runtime.catalogPageSize ) || 12,
  requestTimeoutMs: Number( runtime.requestTimeoutMs ) || 20000
});
