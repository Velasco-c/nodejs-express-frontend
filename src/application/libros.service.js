import { ValidationError } from '../domain/errors.js';
import { validateLibro } from '../domain/validators.js';

function normalizarLibro( datos ){
  const libro = {
    titulo: String( datos.titulo ?? '' ).trim(),
    autor: String( datos.autor ?? '' ).trim(),
    isbn: String( datos.isbn ?? '' ).trim(),
    editorial: String( datos.editorial ?? '' ).trim(),
    anio: datos.anio === '' || datos.anio === null || datos.anio === undefined ? null : Number( datos.anio ),
    precio: Number( datos.precio ?? 0 ),
    stock: Number( datos.stock ?? 0 )
  };
  if( datos.codigo !== undefined ) libro.codigo = String( datos.codigo ?? '' ).trim();
  return libro;
}

export function createLibrosService({ librosApi }){
  async function listar({ pagina = 1, limite = 10, signal } = {}){
    return librosApi.listar({ pagina, limite, signal });
  }

  async function buscar({ q, pagina = 1, limite = 10, signal } = {}){
    const texto = String( q ?? '' ).trim();
    if( !texto ) return { items: [], total: 0 };
    return librosApi.buscar({ q: texto, pagina, limite, signal });
  }

  async function obtener( codigo, opciones = {} ){
    return librosApi.obtener( codigo, opciones );
  }

  async function crear( datos ){
    const validacion = validateLibro( datos );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );
    return librosApi.crear( normalizarLibro( datos ) );
  }

  async function actualizar( codigo, datos ){
    const validacion = validateLibro( datos, { actualizar: true } );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );
    return librosApi.actualizar( codigo, normalizarLibro( datos ) );
  }

  async function eliminar( codigo ){
    return librosApi.eliminar( codigo );
  }

  return { listar, buscar, obtener, crear, actualizar, eliminar };
}
