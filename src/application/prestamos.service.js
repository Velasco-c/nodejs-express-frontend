import { ValidationError } from '../domain/errors.js';
import { validateDevolucion, validatePrestamo } from '../domain/validators.js';

export function createPrestamosService({ prestamosApi }){
  async function listar({ pagina = 1, limite = 10, signal } = {}){
    return prestamosApi.listar({ pagina, limite, signal });
  }

  async function registrar( datos ){
    const limpio = {
      codigoLibro: String( datos?.codigoLibro ?? '' ).trim(),
      identificacionUsuario: String( datos?.identificacionUsuario ?? '' ).trim(),
      fechaPrestamo: String( datos?.fechaPrestamo ?? '' ).trim(),
      fechaTentativaDevolucion: String( datos?.fechaTentativaDevolucion ?? '' ).trim()
    };

    const validacion = validatePrestamo( limpio );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );
    return prestamosApi.registrar( limpio );
  }

  async function devolver( id, fechaDevolucion ){
    const validacion = validateDevolucion( { fechaDevolucion } );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );
    return prestamosApi.devolver( id, fechaDevolucion );
  }

  async function historial({ pagina = 1, limite = 10, signal } = {}){
    return prestamosApi.historial({ pagina, limite, signal });
  }

  return { listar, registrar, devolver, historial };
}
