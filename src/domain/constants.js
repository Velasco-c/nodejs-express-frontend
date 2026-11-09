export const ROLES = Object.freeze({
  ADMIN: 'admin',
  USUARIO: 'usuario'
});

export const SESSION_KEY = 'libreria.sesion';

export const PAGE_SIZE = 10;
export const CATALOG_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;
export const LOW_STOCK_DEFAULT = 2;

export const RUTAS = Object.freeze({
  LOGIN: '/login',
  REGISTRO: '/registro',
  ADMIN: '/admin',
  ADMIN_LIBROS: '/admin/libros',
  ADMIN_USUARIOS: '/admin/usuarios',
  ADMIN_PRESTAMOS: '/admin/prestamos',
  ADMIN_VENTAS: '/admin/ventas',
  ADMIN_INVENTARIO: '/admin/inventario',
  CATALOGO: '/catalogo',
  PERFIL: '/perfil',
  MIS_PRESTAMOS: '/mis-prestamos',
  MIS_COMPRAS: '/mis-compras'
});

export const MENSAJES = Object.freeze({
  SESION_EXPIRADA: 'Tu sesión expiró. Inicia sesión de nuevo.',
  SESION_INVALIDA: 'La sesión guardada no es válida. Inicia sesión de nuevo.',
  SIN_CONEXION: 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.',
  ERROR_GENERICO: 'No se pudo completar la operación. Intenta de nuevo.'
});

export const CREDENCIALES_DEMO = Object.freeze([
  { etiqueta: 'Administrador', identificacion: 'admin' },
  { etiqueta: 'Cliente', identificacion: '1001' }
]);

export const DEMO_PASSWORD = 'Libreria2026';
