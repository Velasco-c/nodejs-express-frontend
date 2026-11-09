const identificacionUrl = identificacion => encodeURIComponent( String( identificacion ?? '' ).trim() );

export function createUsuariosApi( http ){
  return {
    async registro( datos ){
      const { data } = await http.post( '/usuarios/registro', {
        identificacion: String( datos.identificacion ?? '' ).trim(),
        nombre: String( datos.nombre ?? '' ).trim(),
        telefono: String( datos.telefono ?? '' ).trim(),
        direccion: String( datos.direccion ?? '' ).trim(),
        email: String( datos.email ?? '' ).trim(),
        password: String( datos.password ?? '' )
      }, { skipAuthHandler: true } );
      return data;
    },

    async perfil({ signal } = {}){
      const { data } = await http.get( '/usuarios/perfil', { signal } );
      return data;
    },

    async actualizarPerfil( cambios ){
      const { data } = await http.put( '/usuarios/perfil', cambios );
      return data;
    },

    async listar({ pagina = 1, limite = 10, signal } = {}){
      const { data, total } = await http.get( '/usuarios', { query: { pagina, limite }, signal } );
      return { items: data ?? [], total: total ?? 0 };
    },

    async obtener( identificacion, { signal } = {} ){
      const { data } = await http.get( `/usuarios/${ identificacionUrl( identificacion ) }`, { signal } );
      return data;
    }
  };
}
