export function createInventarioApi( http ){
  return {
    async resumen( minimo = 2, { signal } = {} ){
      const { data } = await http.get( '/inventario', { query: { minimo }, signal } );
      return data;
    }
  };
}
