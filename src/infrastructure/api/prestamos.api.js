const idUrl = id => encodeURIComponent( String( id ?? '' ).trim() );

export function createPrestamosApi( http ){
  return {
    async listar({ pagina = 1, limite = 10, signal } = {}){
      const { data, total } = await http.get( '/prestamos', { query: { pagina, limite }, signal } );
      return { items: data ?? [], total: total ?? 0 };
    },

    async registrar( datos ){
      const { data } = await http.post( '/prestamos', {
        codigoLibro: String( datos.codigoLibro ?? '' ).trim(),
        identificacionUsuario: String( datos.identificacionUsuario ?? '' ).trim(),
        ...( datos.fechaPrestamo ? { fechaPrestamo: datos.fechaPrestamo } : {} ),
        fechaTentativaDevolucion: datos.fechaTentativaDevolucion
      });
      return data;
    },

    async devolver( id, fechaDevolucion ){
      const { data } = await http.put( `/prestamos/${ idUrl( id ) }/devolucion`, {
        ...( fechaDevolucion ? { fechaDevolucion } : {} )
      });
      return data;
    },

    async historial({ pagina = 1, limite = 10, signal } = {}){
      const { data, total } = await http.get( '/prestamos/historial', { query: { pagina, limite }, signal } );
      return { items: data ?? [], total: total ?? 0 };
    },

    async solicitar( datos ){
      const { data } = await http.post( '/prestamos/solicitudes', {
        codigoLibro: String( datos.codigoLibro ?? '' ).trim(),
        fechaTentativaDevolucion: datos.fechaTentativaDevolucion
      });
      return data;
    },

    async listarSolicitudes({ pagina = 1, limite = 10, signal } = {} ){
      const { data, total } = await http.get( '/prestamos/solicitudes', { query: { pagina, limite }, signal } );
      return { items: data ?? [], total: total ?? 0 };
    },

    async misSolicitudes({ pagina = 1, limite = 10, signal } = {} ){
      const { data, total } = await http.get( '/prestamos/solicitudes/mis-solicitudes', { query: { pagina, limite }, signal } );
      return { items: data ?? [], total: total ?? 0 };
    },

    async resolverSolicitud( id, resolucion ){
      const { data } = await http.put( `/prestamos/solicitudes/${ idUrl( id ) }/${ resolucion }` );
      return data;
    }
  };
}
