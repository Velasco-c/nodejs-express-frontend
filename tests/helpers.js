export function crearAlmacenamiento({
  inicial = {},
  fallaAlLeer = false,
  fallaAlEscribir = false
} = {}){
  const datos = new Map( Object.entries( inicial ) );

  return {
    datos,
    getItem( clave ){
      if( fallaAlLeer ) throw new Error( 'lectura bloqueada' );
      return datos.get( clave ) ?? null;
    },
    setItem( clave, valor ){
      if( fallaAlEscribir ) throw new Error( 'escritura bloqueada' );
      datos.set( clave, String( valor ) );
    },
    removeItem( clave ){
      datos.delete( clave );
    }
  };
}

export function crearJwt( payload, { header = { alg: 'HS256', typ: 'JWT' } } = {} ){
  const base64url = valor => Buffer.from( JSON.stringify( valor ) )
    .toString( 'base64url' );

  return `${ base64url( header ) }.${ base64url( payload ) }.firma-de-prueba`;
}

export function respuestaJson( cuerpo, { status = 200, headers = {} } = {} ){
  return new Response( JSON.stringify( cuerpo ), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

export function crearFetchFalso( manejador ){
  const llamadas = [];
  const fetchFalso = async ( url, opciones = {} ) => {
    const llamada = { url: String( url ), opciones };
    llamadas.push( llamada );
    const resultado = await manejador( llamada, llamadas.length - 1 );
    if( resultado instanceof Response ) return resultado;
    return respuestaJson( resultado.body, resultado );
  };

  fetchFalso.llamadas = llamadas;
  return fetchFalso;
}

export const sesionValida = ( sobre = {} ) => ({
  token: 'token-de-prueba',
  usuario: {
    identificacion: '1001',
    nombre: 'Ana Pérez',
    telefono: '5555-1234',
    direccion: 'Zona 1',
    email: 'ana@mail.com'
  },
  role: 'usuario',
  identificacion: '1001',
  issuedAt: Date.now() - 1000,
  expiresAt: Date.now() + 3600000,
  ...sobre
});
