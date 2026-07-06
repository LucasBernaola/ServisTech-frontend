# ServisTech Frontend

Frontend de ServisTech, un sistema web para gestionar el trabajo diario de un taller de reparación técnica. La aplicación permite administrar clientes, órdenes de reparación, estados de trabajo, fichas imprimibles y seguimiento público para el cliente.

El objetivo del frontend es ofrecer una interfaz clara y rápida para que el taller pueda trabajar sin depender de planillas o registros sueltos.

## Stack

- Next.js 15 con App Router
- React 19
- TypeScript
- Tailwind CSS
- pnpm
- Radix UI para diálogos
- Lucide React para iconos

## Funcionalidades principales

- Home pública con acceso al sistema y enlace al admin de Django.
- Login contra el backend Django usando cookies HttpOnly.
- Middleware de protección para rutas internas.
- Dashboard con órdenes y clientes recientes.
- Gestión de órdenes:
  - listado paginado;
  - búsqueda;
  - filtros por estado;
  - creación de orden;
  - edición de datos técnicos;
  - carga de fotos;
  - ficha técnica imprimible;
  - orden imprimible con QR de seguimiento;
  - cambio de estado mediante wizard.
- Gestión de clientes:
  - listado paginado;
  - búsqueda;
  - autocompletado;
  - alta y edición.
- Ajustes de cuenta:
  - edición de perfil;
  - cambio de contraseña;
  - lectura de permisos del usuario.
- Seguimiento público por URL para que el cliente consulte el avance de su equipo.

## Estructura del proyecto

```txt
frontend/
  src/
    app/
      (public)/              Home pública
      (app)/                 Rutas internas protegidas
        dashboard/           Resumen del taller
        orders/              Listado y flujo de órdenes
        clients/             Listado y búsqueda de clientes
        settings/            Perfil y seguridad
      api/auth/              Rutas internas de auth para Next
      seguimiento/[token]/   Seguimiento público
      imprimir/              Vistas imprimibles
      globals.css            Estilos globales y utilidades visuales
    components/
      orders/                Componentes específicos de órdenes
      Shell.tsx              Layout interno
      Sidebar.tsx            Navegación
      Topbar.tsx             Cabecera interna
      LoginModal.tsx         Login
    lib/
      api/                   Cliente HTTP y llamadas al backend
      orders/                Helpers de estados, dinero y validaciones
      config.ts              Variables de entorno y URLs base
    types/
      orders.ts              Tipos compartidos de órdenes y clientes
```

## Variables de entorno

Crear un archivo `.env.local` dentro de `frontend/`.

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
API_BASE_URL=http://127.0.0.1:8000
DJANGO_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
```

Notas:

- `NEXT_PUBLIC_API_URL` apunta al backend Django.
- `API_BASE_URL` se usa del lado servidor cuando Next consulta el backend.
- `DJANGO_API_URL` se usa en el proxy de login para pegarle a `/api/token/`.
- `NEXT_PUBLIC_SITE_URL` se usa para generar URLs públicas, por ejemplo en impresiones.

En desarrollo local se puede usar `localhost` o `127.0.0.1`, pero conviene mantener consistencia entre backend y frontend para evitar problemas con cookies.

## Instalación

Desde la carpeta `frontend`:

```powershell
pnpm install
```

Levantar el servidor de desarrollo:

```powershell
pnpm dev
```

Por defecto queda disponible en:

```txt
http://localhost:3000
```

Si necesitás elegir puerto manualmente:

```powershell
pnpm exec next dev -H 127.0.0.1 -p 3001
```

## Scripts disponibles

```powershell
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm start
```

- `typecheck`: valida TypeScript sin generar build.
- `lint`: ejecuta las reglas de Next/ESLint.
- `build`: genera una build de producción.
- `start`: levanta la build generada.

## Autenticación

El login no llama directamente al backend desde el navegador. El flujo pasa por una ruta interna de Next:

```txt
POST /api/auth/login
```

Esa ruta llama al backend:

```txt
POST /api/token/
```

El backend devuelve cookies `access_token` y `refresh_token`. Next las reescribe para que funcionen en el dominio del frontend durante desarrollo.

Las rutas internas protegidas se controlan con `src/middleware.ts`. Si no existe `access_token`, se redirige al home.

Rutas protegidas:

```txt
/dashboard
/orders
/clients
/settings
```

## Comunicación con el backend

El frontend usa dos tipos de llamadas:

- Server-side, mediante `serverFetch`, para cargar datos en páginas del App Router.
- Client-side, mediante `apiRequest`, para acciones desde modales o componentes interactivos.

Principales integraciones:

- `/api/clientes/`
- `/api/ordenes/`
- `/api/ordenes/{id}/estado/`
- `/api/ordenes/{id}/fotos/`
- `/api/profile/`
- `/api/profile/change-password/`
- `/api/public/orden/{token}/`

## Impresión y seguimiento

El sistema tiene tres vistas públicas importantes:

```txt
/seguimiento/[token]
/imprimir/orden/[id]
/imprimir/ficha/[id]
```

- `seguimiento/[token]`: permite que el cliente vea el estado de su equipo con una URL pública.
- `imprimir/orden/[id]`: genera una orden imprimible con QR de seguimiento.
- `imprimir/ficha/[id]`: genera una ficha técnica compacta para el taller.

Estas vistas están pensadas para ser simples, legibles y compatibles con impresión.

## Diseño y UX

La interfaz usa una línea visual oscura, sobria y técnica. La idea es que el sistema se sienta como una herramienta de trabajo real, no como una landing genérica.

Criterios aplicados:

- navegación simple;
- panel interno con sidebar y topbar;
- modales tipo bottom sheet en mobile;
- botones grandes para acciones críticas;
- tablas en desktop y cards en mobile;
- formularios con foco en carga rápida;
- impresión separada del diseño de pantalla.

## Validaciones recomendadas

Antes de subir cambios:

```powershell
pnpm run typecheck
pnpm run lint
pnpm run build
```

También conviene revisar manualmente:

- login;
- creación de cliente;
- creación de orden;
- cambio de estado;
- vista de detalle de orden;
- carga de fotos;
- seguimiento público;
- impresión de orden y ficha técnica.
