import { hoyISO } from './formatters.js';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esTexto = ( valor ) => typeof valor === 'string' && valor.trim().length > 0;

const esEntero = ( valor ) => {
  if( typeof valor === 'number' ) return Number.isInteger( valor );
  if( typeof valor === 'string' && valor.trim() !== '' ) return /^-?\d+$/.test( valor.trim() );
  return false;
};

const esEnteroNoNegativo = ( valor ) => esEntero( valor ) && Number( valor ) >= 0;

const esNumeroNoNegativo = ( valor ) => {
  if( valor === '' || valor === null || valor === undefined ) return false;
  const numero = Number( valor );
  return Number.isFinite( numero ) && numero >= 0;
};

export function esFechaValida( valor ){
  if( typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test( valor ) ) return false;
  const fecha = new Date( `${ valor }T00:00:00Z` );
  return !Number.isNaN( fecha.getTime() ) && fecha.toISOString().slice( 0, 10 ) === valor;
}

const resultado = ( errores ) => ({
  valid: Object.keys( errores ).length === 0,
  errors: errores,
  firstError: Object.values( errores )[0] ?? null
});

export function validateLogin( valores ){
  const errores = {};
  if( !esTexto( valores.identificacion ) ) errores.identificacion = 'La identificación es obligatoria';
  if( !esTexto( valores.password ) ) errores.password = 'La contraseña es obligatoria';
  return resultado( errores );
}

export function validateRegistro( valores ){
  const errores = {};
  const requeridos = {
    identificacion: 'La identificación es obligatoria',
    nombre: 'El nombre es obligatorio',
    telefono: 'El teléfono es obligatorio',
    direccion: 'La dirección es obligatoria',
    email: 'El correo es obligatorio',
    password: 'La contraseña es obligatoria'
  };

  for( const [ campo, mensaje ] of Object.entries( requeridos ) ){
    if( !esTexto( valores[campo] ) ) errores[campo] = mensaje;
  }

  if( esTexto( valores.email ) && !RE_EMAIL.test( valores.email.trim() ) ){
    errores.email = 'El correo no es válido';
  }

  if( esTexto( valores.password ) && ( valores.password.length < 8 || valores.password.length > 72 ) ){
    errores.password = 'La contraseña debe tener entre 8 y 72 caracteres';
  }

  return resultado( errores );
}

export function validatePerfil( valores ){
  const errores = {};
  if( valores.email !== undefined && valores.email !== '' && !RE_EMAIL.test( String( valores.email ).trim() ) ){
    errores.email = 'El correo no es válido';
  }
  if( valores.password !== undefined && valores.password !== '' ){
    if( String( valores.password ).length < 8 || String( valores.password ).length > 72 ){
      errores.password = 'La contraseña debe tener entre 8 y 72 caracteres';
    }
  }
  return resultado( errores );
}

export function validateLibro( valores, { actualizar = false } = {} ){
  const errores = {};

  if( !actualizar && !esTexto( valores.codigo ) ) errores.codigo = 'El código es obligatorio';
  if( !esTexto( valores.titulo ) ) errores.titulo = 'El título es obligatorio';
  if( !esTexto( valores.autor ) ) errores.autor = 'El autor es obligatorio';

  if( valores.anio !== undefined && valores.anio !== '' && valores.anio !== null && !esEntero( valores.anio ) ){
    errores.anio = 'El año debe ser un número entero';
  }

  if( valores.precio !== undefined && valores.precio !== '' && !esNumeroNoNegativo( valores.precio ) ){
    errores.precio = 'El precio debe ser un número mayor o igual a 0';
  }

  if( valores.stock !== undefined && valores.stock !== '' && !esEnteroNoNegativo( valores.stock ) ){
    errores.stock = 'El stock debe ser un entero mayor o igual a 0';
  }

  return resultado( errores );
}

export function validatePrestamo( valores ){
  const errores = {};

  if( !esTexto( valores.codigoLibro ) ) errores.codigoLibro = 'El código del libro es obligatorio';
  if( !esTexto( valores.identificacionUsuario ) ) errores.identificacionUsuario = 'La identificación del cliente es obligatoria';

  const fechaPrestamo = valores.fechaPrestamo || hoyISO();
  if( !esFechaValida( fechaPrestamo ) ){
    errores.fechaPrestamo = 'La fecha de préstamo debe tener formato AAAA-MM-DD y existir en el calendario';
  }

  if( !esFechaValida( valores.fechaTentativaDevolucion ) ){
    errores.fechaTentativaDevolucion = 'La fecha de devolución debe tener formato AAAA-MM-DD y existir en el calendario';
  }
  else if( esFechaValida( fechaPrestamo ) && valores.fechaTentativaDevolucion < fechaPrestamo ){
    errores.fechaTentativaDevolucion = 'La fecha tentativa de devolución no puede ser anterior al préstamo';
  }

  return resultado( errores );
}

export function validateDevolucion( valores ){
  const errores = {};
  if( valores.fechaDevolucion && !esFechaValida( valores.fechaDevolucion ) ){
    errores.fechaDevolucion = 'La fecha de devolución debe tener formato AAAA-MM-DD y existir en el calendario';
  }
  return resultado( errores );
}

export function validateVenta( valores ){
  const errores = {};
  if( !esTexto( valores.identificacionCliente ) ){
    errores.identificacionCliente = 'La identificación del cliente es obligatoria';
  }

  if( !Array.isArray( valores.libros ) || valores.libros.length === 0 ){
    errores.libros = 'Agrega al menos un libro a la venta';
    return resultado( errores );
  }

  valores.libros.forEach( ( item, indice ) => {
    if( !esTexto( item.codigo ) ){
      errores[`libros.${ indice }.codigo`] = `Selecciona el libro de la fila ${ indice + 1 }`;
    }
    if( !esEntero( item.cantidad ) || Number( item.cantidad ) <= 0 ){
      errores[`libros.${ indice }.cantidad`] = `La cantidad de la fila ${ indice + 1 } debe ser un entero mayor a 0`;
    }
  });

  return resultado( errores );
}

export function validateBusqueda( valor ){
  const errores = {};
  if( !esTexto( valor ) ) errores.q = 'Escribe un título, autor o ISBN para buscar';
  return resultado( errores );
}
