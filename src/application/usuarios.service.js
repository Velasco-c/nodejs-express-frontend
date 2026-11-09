export function createUsuariosService({ usuariosApi }){
  return {
    listar({ pagina = 1, limite = 10, signal } = {}){
      return usuariosApi.listar({ pagina, limite, signal });
    },
    obtener( identificacion, opciones = {} ){
      return usuariosApi.obtener( identificacion, opciones );
    }
  };
}
