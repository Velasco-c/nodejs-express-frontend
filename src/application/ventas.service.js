import { ValidationError } from '../domain/errors.js';
import { validatePedido, validateVenta } from '../domain/validators.js';

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

  async function crearPedido( datos ){
    const limpio = { libros: ( datos?.libros ?? [] ).map( item => ({
      codigo: String( item?.codigo ?? '' ).trim(), cantidad: Number( item?.cantidad )
    })) };
    const validacion = validatePedido( limpio );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );
    return ventasApi.crearPedido( limpio.libros );
  }

  async function misPedidos({ pagina = 1, limite = 10, signal } = {}){
    return ventasApi.misPedidos({ pagina, limite, signal });
  }

  async function listarPedidos({ pagina = 1, limite = 10, signal } = {}){
    return ventasApi.listarPedidos({ pagina, limite, signal });
  }

  async function resolverPedido( id, resolucion ){
    if( ![ 'confirmar', 'rechazar' ].includes( resolucion ) ) throw new Error( 'Resolución de pedido no válida' );
    return ventasApi.resolverPedido( id, resolucion );
  }

  return { listar, registrar, misCompras, crearPedido, misPedidos, listarPedidos, resolverPedido };
}
