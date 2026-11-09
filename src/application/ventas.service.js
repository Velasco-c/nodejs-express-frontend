import { ValidationError } from '../domain/errors.js';
import { validateVenta } from '../domain/validators.js';

export function createVentasService({ ventasApi }){
  async function listar({ pagina = 1, limite = 10, signal } = {}){
    return ventasApi.listar({ pagina, limite, signal });
  }

  async function registrar( datos ){
    const limpio = {
      identificacionCliente: String( datos?.identificacionCliente ?? '' ).trim(),
      libros: ( datos?.libros ?? [] ).map( item => ({
        codigo: String( item?.codigo ?? '' ).trim(),
        cantidad: Number( item?.cantidad )
      }))
    };

    const validacion = validateVenta( limpio );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );
    return ventasApi.registrar( limpio );
  }

  async function misCompras({ pagina = 1, limite = 10, signal } = {}){
    return ventasApi.misCompras({ pagina, limite, signal });
  }

  return { listar, registrar, misCompras };
}
