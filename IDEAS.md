# Ideas de mejoras

Posibles funciones para la app de proveedores y pedidos. Ordenadas por tema, con una línea de qué aportan.

## Ya implementado

- **Comparador de compras** (`/comparar`): costo unitario, MOQ, envío y pedido mínimo por proveedor, con la mejor opción marcada.
- **Envío por proveedor**: costo de envío y envío gratis desde cierto monto.
- **WhatsApp directo**: envío del pedido con `wa.me` y texto precargado.

## Del lado de la plata

1. **Importar la lista de precios del proveedor** (PDF, Excel o pegar texto) y compararla contra el catálogo: detecta aumentos, productos nuevos y cuáles dejaron de estar.
2. **Precio de venta inverso** — "si lo vendo a $X, ¿cuánto puedo pagar de costo+envío y seguir ganando?". Sirve para negociar.
3. **Actualización masiva de costos** por porcentaje (inflación/lista nueva) y recálculo automático del precio de venta.
4. **Cotizaciones/presupuestos para clientes** exportables a PDF, armados desde el catálogo.

## Para ahorrar tiempo

5. **Escaneo de código de barras/QR** del producto para abrir o crear la ficha al toque (offline con la cámara).
6. **Plantillas de mensajes** por situación: pedir cotización, pedir catálogo, reclamar faltante, avisar pago. Se completan con datos del proveedor/pedido.
7. **Pegar un chat de WhatsApp** y que la app arme el pedido con ítems y cantidades automáticamente.

## Para decidir mejor

8. **Riesgo de dependencia** — qué % de las compras (por monto y por categoría) dependen de un solo proveedor, y qué alternativas hay cargadas.
9. **Diario de incidencias** — faltantes, demoras y problemas de calidad con foto, para negociar y comparar proveedores con datos.
10. **Agenda de ferias/viajes de compra** — presupuesto, checklist de lo que se quiere conseguir y proveedores a ver en cada evento.

## Ideas anteriores (evaluadas)

- **Carrito multi-producto** con optimización de envío/mínimo por proveedor.
- **Historial de costos** con alerta de aumentos.
- **Estado de cuenta por proveedor** (pagos, deuda, saldo).
- **Recepción de pedidos** con faltantes y diferencias.
- **Recordatorio de recompra** según plazo de entrega y último pedido.
- **Búsqueda global (Ctrl+K)** de proveedores, productos y pedidos.
- **Import/export CSV** de productos y pedidos.
- **PWA instalable + backup automático**.
- **Puntaje de proveedor** con cumplimiento y demoras reales.
- **Adjuntar fotos/facturas** al pedido.
- **Multi-moneda real** con cotización manual.

## Priorizadas

1. **Importar lista de precios del proveedor** — el mayor ahorro y control de costos.
2. **Riesgo de dependencia** — decisión estratégica con los datos que ya existen.
3. **Cotizaciones a clientes** — abre el lado de venta de la app.
