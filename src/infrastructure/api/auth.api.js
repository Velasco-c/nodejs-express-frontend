export function createAuthApi( http ){
  return {
    async login( credenciales ){
      const { data } = await http.post( '/auth/login', {
        identificacion: String( credenciales.identificacion ?? '' ).trim(),
        password: String( credenciales.password ?? '' )
      }, { skipAuthHandler: true } );
      return data;
    }
  };
}
