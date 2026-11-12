# Andy Electric · Plataforma de gestión de material

App web (funciona en celular y en PC) para que cada material quede ligado a su proyecto:
pedidos desde el celular, una sola bandeja para la bodega, inventario de bodega y vans,
faltantes listos para compras y costo estimado vs real.

- **Propuesta y roadmap:** documento "Andy Electric – Propuesta de plataforma de gestión de material"
- **Diseño (Figma):** https://www.figma.com/design/KeWrsxHSDgmUqTKcru6hEo

## Estado

**Fase 0 · Base** (este repo hoy)

- Proyecto Next.js + Tailwind con los colores y tipografías del brand de Andy (Inter para títulos, Montserrat para textos).
- Modelo de datos completo en `src/db/schema.ts` y migraciones en `drizzle/`.
- Datos de ejemplo: equipo, bodega y 5 vans, catálogo de 90 materiales con alias de jerga, proyectos y un pedido.
- Página `/catalogo` para probar la búsqueda con jerga ("pipe 3/4", "la amarilla", "breaker de 20").

**Fase 1 · Pedidos** (en curso)

- `/entrar`: elegir quién eres (demo, sin contraseña todavía).
- `/campo` (celular): el líder de van pide material por proyecto, con búsqueda en jerga o texto libre, y confirma cuando lo recibe.
- `/bodega` (computador): bandeja de Jimmy, detalle del pedido, conciliar texto libre (se aprende como alias), marcar listo y entregar.
- Al entregar se descuenta el stock de bodega con movimientos y lo que falte queda como solicitud de compra.

**Beta** (este repo hoy, todo diseñado antes en Figma)

- `/proyectos`: lista, crear proyecto (nombre/dirección, encargado, equipo/van, tipo roof·trim·ambos·service call·otro, fases con especificaciones y revisiones por pasar) y detalle con histórico desde que nace, quién lo creó y quién es el encargado. Crean proyectos Jimmy, Alex, El Niño, Andrés y Miguel.
- `/pedidos`: tablero de pedidos organizado por proyecto, con el detalle de cada pedido.
- Avisos al pedir: posible duplicado, exceso sobre el estimado (límite configurable), proyecto cerrado o en pausa, sin conexión (el borrador queda guardado en el teléfono).
- `/ajustes`: idioma EN / ES por cuenta (inglés americano por defecto). `/admin/usuarios` y `/admin/limites`: solo los 4 administradores (Andrés, Miguel, Jimmy, Karina) crean y gestionan perfiles (nombre, correo, contraseña, equipo) y fijan monto de aprobación, % de exceso y horas de recordatorio.
- `/entrar`: correo y contraseña para los perfiles creados por un admin; el selector de demo sigue disponible hasta que haya datos reales.
- Pantallas de error y de carga (`error.tsx`, `not-found.tsx`, `loading.tsx`, franja de “sin conexión”).

**Compras**

- `/compras` → Faltantes: lo que quedó corto en las entregas aparece solo; Clara agrega cotizaciones por proveedor, elige la mejor y crea las órdenes de compra (una por proveedor).
- Si la orden pasa del monto límite (ajuste del admin, hoy $500) queda esperando a Miguel, Andrés o Karina para aprobar o rechazar; si no, sale directo.
- Al marcar la orden como recibida, el material entra a la bodega y se recalcula el costo promedio.
- Base de datos: `supabase/compras-update.sql` (dos columnas nuevas), después de `beta-update.sql`.

## Conectar la base de datos (Supabase)

1. Crear un proyecto en Supabase (región East US) y guardar la contraseña de la base.
2. SQL Editor → New query → pegar todo `supabase/setup.sql` → Run. Crea tablas, vista de stock y datos de ejemplo.
3. Connect → Transaction pooler: copiar la URI (puerto 6543) y poner la contraseña donde dice `[YOUR-PASSWORD]`.
4. Vercel → Settings → Environment Variables: `DATABASE_URL` = esa URI. Luego Deployments → Redeploy.

5. Las actualizaciones (`supabase/*-update.sql`) se aplican solas en cada despliegue de Vercel (`scripts/apply-updates.ts`, antes del build) y se anotan en la tabla `app_updates`; no hace falta pegarlas a mano. Para correrlas localmente: `npm run db:updates`.

La contraseña nunca va en el código ni en el chat; solo en Vercel. Opcional: `SESSION_SECRET` (cualquier texto largo) para firmar la sesión; si falta se usa `DATABASE_URL`.

`supabase/setup.sql` se regenera desde una base local recién sembrada (migraciones + `pg_dump --data-only`).

## Cómo está armado

| Pieza | Herramienta | Para qué |
| --- | --- | --- |
| App | Next.js (React) | Una sola app para celular y PC |
| Estilos | Tailwind CSS | Tokens del design system en `src/app/globals.css` |
| Base de datos | PostgreSQL en Supabase | Inventario, pedidos, proyectos, compras |
| Acceso a datos | Drizzle ORM | Esquema tipado y migraciones versionadas |
| Hosting | Vercel | Publicación automática desde GitHub |

### Ideas clave del modelo de datos

- **Todo pasa por un "pedido de material"** ligado a un proyecto, con un tipo: estimación, diario, urgente (service call) o retiro rápido.
- **El inventario nunca se edita a mano.** Cada entrada, salida, devolución o ajuste es un movimiento; el stock se calcula con la vista `stock_by_location`.
- **Catálogo con jerga:** cada material tiene alias en español, inglés o spanglish. Cuando Jimmy concilia un texto libre, ese texto se guarda como alias nuevo.
- **Multi-empresa:** todas las tablas llevan `company_id`.

## Correrlo en tu computador

Requisitos: [Node.js 22](https://nodejs.org) y una base de datos Postgres (recomendado: un proyecto gratis en [Supabase](https://supabase.com)).

```bash
npm install
cp .env.example .env.local   # llena DATABASE_URL con la conexión de Supabase
npm run db:migrate           # crea las tablas
npm run db:seed              # carga los datos de ejemplo
npm run dev                  # abre http://localhost:3000
```

La página de inicio y `/catalogo` funcionan sin base de datos.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run typecheck` | Revisa los tipos de TypeScript |
| `npm run db:generate` | Genera una migración después de cambiar `schema.ts` |
| `npm run db:migrate` | Aplica las migraciones a la base de datos |
| `npm run db:seed` | Carga datos de ejemplo |
| `npm run db:studio` | Abre un visor de la base de datos |

## Nota sobre los datos

El catálogo de ejemplo viene del prototipo anterior de este repo. Se reemplaza por
materiales, suppliers y precios reales a partir de facturas de Andy Electric.
