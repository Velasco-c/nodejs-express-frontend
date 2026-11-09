const codigoUrl = codigo => encodeURIComponent( String( codigo ?? '' ).trim() );

export function createLibrosApi( http ){
  return {
    async listar({ pagina = 1, limite = 10, signal } = {}){
      const { data, total } = await http.get( '/libros', { query: { pagina, limite }, signal } );
      return { items: data ?? [], total: total ?? 0 };
    },

    async buscar({ q, pagina = 1, limite = 10, signal } = {}){
      const { data, total } = await http.get( '/libros/buscar', {
        query: { q: String( q ?? '' ).trim(), pagina, limite },
        signal
      });
      return { items: data ?? [], total: total ?? 0 };
    },

    async obtener( codigo, { signal } = {} ){
      const { data } = await http.get( `/libros/${ codigoUrl( codigo ) }`, { signal } );
      return data;
    },

    async crear( libro ){
      const { data } = await http.post( '/libros', libro );
      return data;
    },

    async actualizar( codigo, cambios ){
      const { data } = await http.put( `/libros/${ codigoUrl( codigo ) }`, cambios );
      return data;
    },

    async eliminar( codigo ){
      const { data } = await http.delete( `/libros/${ codigoUrl( codigo ) }` );
      return data;
    }
  };
}
