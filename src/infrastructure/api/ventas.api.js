export function createVentasApi( http ){
  return {
    async listar({ pagina = 1, limite = 10, signal } = {}){
      const { data, total } = await http.get( '/ventas', { query: { pagina, limite }, signal } );
      return { items: data ?? [], total: total ?? 0 };
    },

    async registrar( venta ){
      const { data } = await http.post( '/ventas', {
        identificacionCliente: String( venta.identificacionCliente ?? '' ).trim(),
        libros: ( venta.libros ?? [] ).map( item => ({
          codigo: String( item.codigo ?? '' ).trim(),
          cantidad: Number( item.cantidad )
        }))
      });
      return data;
    },

    async misCompras({ pagina = 1, limite = 10, signal } = {}){
      const { data, total } = await http.get( '/ventas/mis-compras', { query: { pagina, limite }, signal } );
      return { items: data ?? [], total: total ?? 0 };
    }
  };
}
