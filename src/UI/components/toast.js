import { icon } from './icons.js';

let root = null;

function obtenerRoot(){
  if( root && root.isConnected ) return root;
  root = document.getElementById( 'toast-root' );
  if( !root ){
    root = document.createElement( 'div' );
    root.id = 'toast-root';
    root.className = 'toast-root';
    document.body.append( root );
  }
  return root;
}

const ICONOS = {
  success: 'check-circle',
  error: 'alert',
  info: 'info',
  warning: 'alert'
};

export function showToast( mensaje, { type = 'info', title = null, duration = 4500 } = {} ){
  const contenedor = obtenerRoot();
  const toast = document.createElement( 'div' );
  toast.className = `toast toast-${ type }`;
  toast.setAttribute( 'role', type === 'error' ? 'alert' : 'status' );

  const icono = document.createElement( 'span' );
  icono.className = 'toast-icon';
  icono.innerHTML = icon( ICONOS[type] ?? 'info', 20 ).toString();

  const contenido = document.createElement( 'div' );
  contenido.className = 'toast-content';
  if( title ){
    const titulo = document.createElement( 'strong' );
    titulo.textContent = title;
    contenido.append( titulo );
  }
  const texto = document.createElement( 'p' );
  texto.textContent = mensaje;
  contenido.append( texto );

  const cerrar = document.createElement( 'button' );
  cerrar.type = 'button';
  cerrar.className = 'toast-close';
  cerrar.setAttribute( 'aria-label', 'Cerrar notificación' );
  cerrar.innerHTML = icon( 'x', 16 ).toString();
  cerrar.addEventListener( 'click', () => remover() );

  toast.append( icono, contenido, cerrar );
  contenedor.append( toast );

  let temporizador = null;
  let pausado = false;

  const remover = () => {
    if( !toast.isConnected ) return;
    clearTimeout( temporizador );
    toast.classList.add( 'is-leaving' );
    toast.addEventListener( 'animationend', () => toast.remove(), { once: true } );
    setTimeout( () => toast.remove(), 320 );
  };

  const programar = () => {
    if( duration <= 0 ) return;
    clearTimeout( temporizador );
    temporizador = setTimeout( remover, duration );
  };

  toast.addEventListener( 'mouseenter', () => {
    pausado = true;
    clearTimeout( temporizador );
  });
  toast.addEventListener( 'mouseleave', () => {
    if( pausado ) programar();
  });

  programar();
  return remover;
}

export const toastSuccess = ( mensaje, opciones = {} ) => showToast( mensaje, { ...opciones, type: 'success' } );
export const toastError = ( mensaje, opciones = {} ) => showToast( mensaje, { ...opciones, type: 'error', duration: 6500 } );
export const toastInfo = ( mensaje, opciones = {} ) => showToast( mensaje, { ...opciones, type: 'info' } );
export const toastWarning = ( mensaje, opciones = {} ) => showToast( mensaje, { ...opciones, type: 'warning' } );
