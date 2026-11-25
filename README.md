# Proveedores

App web para gestionar proveedores y pedidos de un negocio chico. Funciona 100% en el navegador: los datos se guardan en el dispositivo con IndexedDB (Dexie), sin backend ni cuentas.

## Qué hace

- **Panel**: resumen de proveedores activos, pedidos abiertos, pedidos atrasados y montos, con accesos rápidos.
- **Proveedores**: alta, edición y detalle de proveedores (rubro, etiquetas, estado, contactos, WhatsApp, email, teléfono, web, Instagram, dirección, zona, condiciones de pago, pedido mínimo, costo de envío, envío gratis desde, plazo de entrega y notas).
- **Productos**: catálogo por proveedor con costo, unidad, cantidad mínima (MOQ), categoría y link. Incluye importación masiva pegando un JSON generado por una IA, con prompt incluido, vista previa y detección de duplicados (ver `PROMPT_IMPORTAR_PRODUCTOS.md`).
- **Pedidos**: seguimiento con estados (`interesado`, `por pedir`, `pedido`, `confirmado`, `recibido`, `cancelado`), canal, prioridad, fechas e ítems con cantidad y precio unitario.
- **Detalle de pedido**: totales por ítem y del pedido, y envío directo del texto por WhatsApp (`wa.me`) o email.
- **Comparar compras**: compara un mismo producto entre proveedores con costo unitario, MOQ, envío (y envío gratis desde cierto monto) y pedido mínimo, para ver el total real y elegir qué conviene.
- **Precios**: cálculo de precio de venta sugerido a partir del costo y un margen de ganancia configurable.
- **Ajustes**: nombre del negocio, moneda, locale y margen; backup/restauración de todos los datos en JSON y opción de borrar todo.

Los datos quedan en el dispositivo, por lo que conviene hacer backups periódicos desde Ajustes.

## Stack

- React 19 + TypeScript + Vite
- React Router (rutas programáticas con `createBrowserRouter`)
- Dexie / IndexedDB con `dexie-react-hooks`
- Tailwind CSS 4
- Motion para animaciones, Base UI y Lucide para componentes e íconos
- Biome para lint y formato

## Desarrollo

```bash
pnpm install
pnpm dev       # servidor de desarrollo
pnpm build     # typecheck + build de producción
pnpm preview   # sirve el build
pnpm lint      # biome check
pnpm format    # biome format --write .
```

El proyecto usa el React Compiler (vía Babel), lo que afecta los tiempos de desarrollo y build.

## Estructura

```
src/
  pages/        vistas por ruta (Panel, Proveedores, Pedidos, Ajustes...)
  components/   layout, diálogos, UI compartida y export de pedidos
  db/           esquema Dexie, repositorio y backup
  lib/          formato, cálculos de pedidos y precios, utilidades
  types.ts      modelos de datos (proveedor, pedido, producto, settings)
  router.tsx    definición de rutas
```
