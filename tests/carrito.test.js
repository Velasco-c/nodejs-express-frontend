import test from 'node:test';
import assert from 'node:assert/strict';
import { createCarritoService } from '../src/application/carrito.service.js';

function crearStorage(){
  const datos = new Map();
  return {
    datos,
    getItem: clave => datos.get( clave ) ?? null,
    setItem: ( clave, valor ) => datos.set( clave, valor ),
    removeItem: clave => datos.delete( clave )
  };
}

test( 'carrito agrega, suma, actualiza, quita y limpia títulos', () => {
  const storage = crearStorage();
  const carrito = createCarritoService({ storage, getUserId: () => '1001' });
  assert.deepEqual( carrito.agregar( ' L001 ' ), [ { codigo: 'L001', cantidad: 1 } ] );
  assert.deepEqual( carrito.agregar( 'L001', 2 ), [ { codigo: 'L001', cantidad: 3 } ] );
  assert.deepEqual( carrito.agregar( 'L002' ), [ { codigo: 'L001', cantidad: 3 }, { codigo: 'L002', cantidad: 1 } ] );
  assert.deepEqual( carrito.cambiarCantidad( 'L001', 4 )[0], { codigo: 'L001', cantidad: 4 } );
  assert.deepEqual( carrito.quitar( 'L002' ), [ { codigo: 'L001', cantidad: 4 } ] );
  assert.deepEqual( carrito.limpiar(), [] );
});

test( 'carritos se aíslan por cliente y cantidad tiene límites', () => {
  const storage = crearStorage();
  const clienteA = createCarritoService({ storage, getUserId: () => '1001' });
  const clienteB = createCarritoService({ storage, getUserId: () => '1002' });
  clienteA.agregar( 'L001' );
  assert.deepEqual( clienteB.items(), [] );
  assert.throws( () => clienteA.agregar( 'L002', 101 ), /máximo es 100/ );
  assert.throws( () => clienteA.cambiarCantidad( 'L001', 0 ), /entre 1 y 100/ );
});
