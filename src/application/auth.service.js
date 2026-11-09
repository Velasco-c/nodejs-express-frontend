import { ValidationError } from '../domain/errors.js';
import { validateLogin, validatePerfil, validateRegistro } from '../domain/validators.js';
import { createSession, sessionUser } from '../domain/session.js';

const CAMPOS_PERFIL = [ 'nombre', 'telefono', 'direccion', 'email' ];

export function createAuthService({ authApi, usuariosApi, sessionStore }){
  const oyentes = new Set();
  let sesionActual = sessionStore.read();

  function notificar( sesion ){
    sesionActual = sesion;
    for( const oyente of oyentes ) oyente( sesion );
  }

  function getSession(){
    if( sesionActual && sessionStore.read() === null ){
      notificar( null );
    }
    else if( !sesionActual ){
      sesionActual = sessionStore.read();
    }
    return sesionActual;
  }

  function subscribe( oyente ){
    oyentes.add( oyente );
    return () => oyentes.delete( oyente );
  }

  async function login( credenciales ){
    const limpio = {
      identificacion: String( credenciales?.identificacion ?? '' ).trim(),
      password: String( credenciales?.password ?? '' )
    };

    const validacion = validateLogin( limpio );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );

    const respuesta = await authApi.login( limpio );
    const sesion = createSession({ token: respuesta.token, usuario: respuesta.usuario });
    sessionStore.save( sesion );
    notificar( sesion );
    return sesion;
  }

  async function registro( datos ){
    const limpio = {
      identificacion: String( datos?.identificacion ?? '' ).trim(),
      nombre: String( datos?.nombre ?? '' ).trim(),
      telefono: String( datos?.telefono ?? '' ).trim(),
      direccion: String( datos?.direccion ?? '' ).trim(),
      email: String( datos?.email ?? '' ).trim(),
      password: String( datos?.password ?? '' )
    };

    const validacion = validateRegistro( limpio );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );

    const usuario = await usuariosApi.registro( limpio );

    try {
      const sesion = await login( { identificacion: limpio.identificacion, password: limpio.password } );
      return { usuario, sesion };
    }
    catch {
      return { usuario, sesion: null };
    }
  }

  function logout(){
    sessionStore.clear();
    notificar( null );
  }

  async function cargarPerfil(){
    const usuario = await usuariosApi.perfil();
    const sesion = getSession();
    if( sesion ){
      const renovada = createSession({ token: sesion.token, usuario });
      sessionStore.save( renovada );
      notificar( renovada );
    }
    return usuario;
  }

  async function actualizarPerfil( cambios ){
    const validacion = validatePerfil( cambios );
    if( !validacion.valid ) throw new ValidationError( validacion.errors );

    const payload = {};
    for( const campo of CAMPOS_PERFIL ){
      if( cambios[campo] !== undefined ) payload[campo] = String( cambios[campo] ?? '' ).trim();
    }
    if( cambios.password !== undefined && cambios.password !== '' ){
      payload.password = String( cambios.password );
    }

    const usuario = await usuariosApi.actualizarPerfil( payload );
    const sesion = getSession();
    if( sesion ){
      const renovada = createSession({ token: sesion.token, usuario });
      sessionStore.save( renovada );
      notificar( renovada );
      return { usuario, sesion: renovada };
    }

    return { usuario, sesion: null };
  }

  return {
    getSession,
    getUser: () => sessionUser( getSession() ),
    isAuthenticated: () => Boolean( getSession() ),
    login,
    registro,
    logout,
    cargarPerfil,
    actualizarPerfil,
    subscribe
  };
}
