import { readdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve( fileURLToPath( new URL( '..', import.meta.url ) ) );
const OMITIR = new Set( [ 'node_modules', '.git', 'coverage' ] );

async function recolectar( directorio ){
  const entradas = await readdir( directorio, { withFileTypes: true } );
  const archivos = [];

  for( const entrada of entradas ){
    if( OMITIR.has( entrada.name ) ) continue;
    const ruta = join( directorio, entrada.name );
    if( entrada.isDirectory() ) archivos.push( ...await recolectar( ruta ) );
    else if( extname( entrada.name ) === '.js' ) archivos.push( ruta );
  }

  return archivos;
}

const archivos = await recolectar( RAIZ );
let fallos = 0;

for( const archivo of archivos ){
  const resultado = spawnSync( process.execPath, [ '--check', archivo ], { encoding: 'utf8' } );
  if( resultado.status !== 0 ){
    fallos += 1;
    console.error( `\n✗ ${ archivo.replace( `${ RAIZ }/`, '' ) }\n${ resultado.stderr.trim() }` );
  }
}

if( fallos > 0 ){
  console.error( `\n${ fallos } archivo(s) con errores de sintaxis.` );
  process.exit( 1 );
}

console.log( `✓ Sintaxis correcta en ${ archivos.length } archivos JavaScript.` );
