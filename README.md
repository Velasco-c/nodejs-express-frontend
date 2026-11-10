# nodejs-express-frontend

Aplicación web para operar la librería con perfiles de administrador y cliente. Se mantiene como proyecto independiente de `nodejs-express-backend` y consume su API REST.

## Inicio rápido

Requiere Node.js 20.6 o superior. Arranca primero la API en `http://127.0.0.1:3000`; después, desde este directorio:

```bash
npm install
npm run dev
```

Abre <http://127.0.0.1:5173>. El servidor de desarrollo sirve la SPA y reenvía las rutas `/auth`, `/libros`, `/usuarios`, `/prestamos`, `/ventas`, `/inventario` y `/healthy` a la API.

La dirección de la API se configura con `API_ORIGIN`; el host y el puerto del frontend, con `FRONTEND_HOST` y `FRONTEND_PORT`.

## Arquitectura

La aplicación usa módulos ES nativos y no requiere un bundler. Las dependencias apuntan hacia adentro:

```text
UI (páginas, componentes, router)
  → application (casos de uso por módulo)
  → infrastructure (cliente HTTP y adaptadores de API)
  → backend REST

domain (reglas, sesión, permisos, validaciones y formato)
```

- `src/UI`: vistas y composición de la interfaz.
- `src/application`: casos de uso de autenticación, catálogo, usuarios, préstamos, ventas e inventario.
- `src/domain`: reglas y formatos sin acceso directo a red o DOM.
- `src/infrastructure`: sesión local, configuración, cliente HTTP y adaptadores de endpoints.
- `src/app/container.js`: composición de dependencias, útil para aislar servicios en pruebas.
- `tests`: pruebas de servicios, seguridad de rutas, sesión, validación, vistas y servidor.

## Funcionalidades

- Clientes: registro, inicio de sesión, perfil, catálogo, historial de préstamos y compras.
- Clientes: catálogo con carrito por cuenta, envío de pedidos de compra y consulta de su estado; solicitudes de préstamo con fecha tentativa e historial de solicitudes.
- Administración: panel, gestión de libros y clientes, registro y consulta de préstamos y ventas, pedidos de compra pendientes, aprobación o rechazo de préstamos e inventario.
- Al enviar un pedido se guarda una cotización, sin pago ni reserva de inventario. Administración confirma disponibilidad y entrega; al confirmar, el backend registra la venta en una transacción.
- Las solicitudes de préstamo tampoco reservan inventario. Al aprobar, administración crea el préstamo y descuenta el ejemplar en una transacción; la devolución se registra desde el panel.

No se procesa pago en línea. La confirmación administrativa registra la operación para pago o entrega fuera de la aplicación.

## Comandos

```bash
npm run dev     # servidor local en 127.0.0.1:5173
npm test        # pruebas automatizadas
npm run check   # verificación de sintaxis
```
