import { loginPage } from './pages/login.page.js';
import { registroPage } from './pages/registro.page.js';
import { dashboardPage } from './pages/dashboard.page.js';
import { librosPage } from './pages/libros.page.js';
import { usuariosPage } from './pages/usuarios.page.js';
import { prestamosPage } from './pages/prestamos.page.js';
import { ventasPage } from './pages/ventas.page.js';
import { inventarioPage } from './pages/inventario.page.js';
import { catalogoPage } from './pages/catalogo.page.js';
import { perfilPage } from './pages/perfil.page.js';
import { historialPage } from './pages/historial.page.js';
import { misComprasPage } from './pages/mis-compras.page.js';
import { carritoPage } from './pages/carrito.page.js';
import { pedidosPage } from './pages/pedidos.page.js';
import { misPedidosPage } from './pages/mis-pedidos.page.js';
import { misSolicitudesPage } from './pages/mis-solicitudes.page.js';
import { notFoundPage } from './pages/not-found.page.js';
import { ROLES, RUTAS } from '../domain/constants.js';
import { homePathForRole } from '../domain/authorization.js';

const ADMIN = [ ROLES.ADMIN ];
const CLIENTE = [ ROLES.USUARIO ];

export const routes = [
  {
    path: '/',
    title: 'Inicio',
    layout: 'bare',
    redirect: sesion => ( sesion ? homePathForRole( sesion.role ) : RUTAS.LOGIN )
  },
  {
    path: RUTAS.LOGIN,
    title: 'Iniciar sesión',
    layout: 'auth',
    authMode: 'login',
    publicOnly: true,
    page: loginPage
  },
  {
    path: RUTAS.REGISTRO,
    title: 'Crear cuenta',
    layout: 'auth',
    authMode: 'registro',
    publicOnly: true,
    page: registroPage
  },
  {
    path: RUTAS.ADMIN,
    title: 'Panel',
    layout: 'app',
    roles: ADMIN,
    page: dashboardPage
  },
  {
    path: RUTAS.ADMIN_LIBROS,
    title: 'Libros',
    layout: 'app',
    roles: ADMIN,
    page: librosPage
  },
  {
    path: RUTAS.ADMIN_USUARIOS,
    title: 'Clientes',
    layout: 'app',
    roles: ADMIN,
    page: usuariosPage
  },
  {
    path: RUTAS.ADMIN_PRESTAMOS,
    title: 'Préstamos',
    layout: 'app',
    roles: ADMIN,
    page: prestamosPage
  },
  {
    path: RUTAS.ADMIN_VENTAS,
    title: 'Ventas',
    layout: 'app',
    roles: ADMIN,
    page: ventasPage
  },
  {
    path: RUTAS.ADMIN_PEDIDOS,
    title: 'Pedidos de clientes',
    layout: 'app',
    roles: ADMIN,
    page: pedidosPage
  },
  {
    path: RUTAS.ADMIN_INVENTARIO,
    title: 'Inventario',
    layout: 'app',
    roles: ADMIN,
    page: inventarioPage
  },
  {
    path: RUTAS.CATALOGO,
    title: 'Catálogo',
    layout: 'app',
    roles: CLIENTE,
    page: catalogoPage
  },
  {
    path: RUTAS.CARRITO,
    title: 'Carrito',
    layout: 'app',
    roles: CLIENTE,
    page: carritoPage
  },
  {
    path: RUTAS.PERFIL,
    title: 'Mi perfil',
    layout: 'app',
    roles: CLIENTE,
    page: perfilPage
  },
  {
    path: RUTAS.MIS_PRESTAMOS,
    title: 'Mis préstamos',
    layout: 'app',
    roles: CLIENTE,
    page: historialPage
  },
  {
    path: RUTAS.MIS_COMPRAS,
    title: 'Mis compras',
    layout: 'app',
    roles: CLIENTE,
    page: misComprasPage
  },
  {
    path: RUTAS.MIS_PEDIDOS,
    title: 'Mis pedidos',
    layout: 'app',
    roles: CLIENTE,
    page: misPedidosPage
  },
  {
    path: RUTAS.MIS_SOLICITUDES,
    title: 'Mis solicitudes',
    layout: 'app',
    roles: CLIENTE,
    page: misSolicitudesPage
  },
  {
    path: '*',
    title: 'Página no encontrada',
    layout: 'bare',
    page: notFoundPage
  }
];
