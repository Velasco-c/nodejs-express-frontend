import { createServer } from 'node:http';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));

const PREFIJOS_API = [
  '/auth',
  '/libros',
  '/usuarios',
  '/prestamos',
  '/ventas',
  '/inventario',
  '/healthy'
];

const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const esRutaApi = ( ruta ) => PREFIJOS_API.some( prefijo => ruta === prefijo || ruta.startsWith( `${ prefijo }/` ) );

function resolverArchivo( raiz, ruta ){
  let decodificada;
  try {
    decodificada = decodeURIComponent( ruta );
  }
  catch {
    return null;
  }

  if( decodificada.includes( '\0' ) ) return null;

  const archivo = resolve( raiz, `.${ decodificada }` );
  const raizNormalizada = resolve( raiz );
  if( archivo !== raizNormalizada && !archivo.startsWith( `${ raizNormalizada }${ sep }` ) ) return null;

  return archivo;
}

function responderJson( res, status, cuerpo ){
  if( res.headersSent ) return;
  res.writeHead( status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } );
  res.end( JSON.stringify( cuerpo ) );
}

function proxy( req, res, apiOrigin ){
  let destino;
  try {
    destino = new URL( req.url, apiOrigin );
  }
  catch {
    return responderJson( res, 500, { error: 'Configuración de API inválida' } );
  }

  const solicitud = destino.protocol === 'https:' ? httpsRequest : httpRequest;
  const cabeceras = { ...req.headers, host: destino.host };

  const proxyReq = solicitud({
    protocol: destino.protocol,
    hostname: destino.hostname,
    port: destino.port,
    path: `${ destino.pathname }${ destino.search }`,
    method: req.method,
    headers: cabeceras
  }, proxyRes => {
    res.writeHead( proxyRes.statusCode ?? 502, proxyRes.headers );
    proxyRes.pipe( res );
  });

  proxyReq.on( 'error', () => {
    responderJson( res, 502, { error: 'No se pudo conectar con la API. Verifica que el backend esté en ejecución.' } );
  });

  proxyReq.setTimeout( 30000, () => proxyReq.destroy( new Error( 'Tiempo de espera agotado' ) ) );

  req.pipe( proxyReq );
}

export function createFrontendServer({
  root = ROOT,
  apiOrigin = process.env.API_ORIGIN || 'http://127.0.0.1:3000',
  logger = console
} = {}){
  return createServer( async ( req, res ) => {
    const url = new URL( req.url ?? '/', 'http://localhost' );

    if( esRutaApi( url.pathname ) ){
      return proxy( req, res, apiOrigin );
    }

    if( req.method !== 'GET' && req.method !== 'HEAD' ){
      return responderJson( res, 405, { error: 'Método no permitido' } );
    }

    const ruta = url.pathname === '/' ? '/index.html' : url.pathname;
    const archivo = resolverArchivo( root, ruta );

    if( archivo ){
      try {
        const info = await stat( archivo );
        if( info.isFile() ){
          const contenido = await readFile( archivo );
          res.writeHead( 200, {
            'Content-Type': TIPOS_MIME[extname( archivo ).toLowerCase()] ?? 'application/octet-stream',
            'Content-Length': contenido.length,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
          });
          return res.end( req.method === 'HEAD' ? undefined : contenido );
        }
      }
      catch {
        // El archivo no existe: se intenta el fallback de la SPA.
      }
    }

    const aceptaHtml = String( req.headers.accept ?? '' ).includes( 'text/html' );
    const sinExtension = !extname( ruta );

    if( aceptaHtml && sinExtension ){
      try {
        const contenido = await readFile( resolve( root, 'index.html' ) );
        res.writeHead( 200, {
          'Content-Type': TIPOS_MIME['.html'],
          'Content-Length': contenido.length,
          'Cache-Control': 'no-store'
        });
        return res.end( req.method === 'HEAD' ? undefined : contenido );
      }
      catch( error ){
        logger.error?.( 'No se pudo leer index.html', error );
      }
    }

    responderJson( res, 404, { error: 'Archivo no encontrado' } );
  });
}

const esEjecutadoDirectamente = process.argv[1]
  && resolve( process.argv[1] ) === fileURLToPath( import.meta.url );

if( esEjecutadoDirectamente ){
  const puerto = Number( process.env.FRONTEND_PORT ) || 5173;
  const host = process.env.FRONTEND_HOST || '127.0.0.1';
  const apiOrigin = process.env.API_ORIGIN || 'http://127.0.0.1:3000';
  const servidor = createFrontendServer({ apiOrigin });

  servidor.listen( puerto, host, () => {
    console.log( `Librería frontend en http://${ host }:${ puerto }` );
    console.log( `Proxy de API hacia ${ apiOrigin }` );
  });
}
