# Prompt para importar productos con una IA

Este es el prompt que usa la app en **Proveedor → Catálogo → Importar**. Copialo, reemplazá
`{{PROVEEDOR}}` y `{{MONEDA}}`, y pegalo en la IA junto con el catálogo del proveedor (texto, tabla,
PDF o captura). La respuesta se pega tal cual en la ventana de importación.

---

Convertí este catálogo de productos en un JSON para importarlo a mi app de proveedores.

CONTEXTO

- Proveedor: "{{PROVEEDOR}}".
- Moneda de los precios: {{MONEDA}}.
- Devolveme solamente los productos de este proveedor.

FORMATO DE SALIDA (obligatorio)

- Respondé únicamente con un array JSON válido. Sin texto antes ni después, sin markdown, sin bloques de código, sin comentarios.
- Cada elemento del array es un producto con exactamente estas claves:

  "nombre":    string  Obligatorio. Nombre corto y claro del producto.
  "codigo":    string  Código, SKU o referencia del proveedor. null si no figura.
  "categoria": string  Categoría corta y consistente. null si no se puede inferir.
  "costo":     number  Precio de costo en {{MONEDA}}, sin símbolo de moneda ni separador de miles, con punto decimal. null si no figura.
  "unidad":    string  Unidad de venta: "unidad", "kg", "metro", "caja", "pack", etc. null si no figura.
  "moq":       number  Cantidad mínima de compra. null si no figura.
  "link":      string  URL del producto. null si no figura.
  "imagen":    string  URL absoluta de la imagen del producto (http/https), si el catálogo la incluye. null si no figura.
  "notas":     string  Variantes, colores, medidas, presentación o aclaraciones breves. null si no hay.

REGLAS

1. No inventes datos: si un dato no aparece en el catálogo, usá null.
2. Un objeto por producto comprable. Si un mismo artículo tiene variantes con distinto código o precio, creá un objeto por variante y aclarala en "notas".
3. Mantené los nombres tal como aparecen (sin traducir marcas ni modelos) y no repitas la categoría dentro del nombre.
4. Pasá los precios a número. Ejemplos: "$ 1.234,50" → 1234.5; "1,234.50" → 1234.5; "3.500" → 3500; "s/precio" → null. Si el precio es por pack o caja, usá ese total y aclaralo en "unidad" y "notas".
5. Conservá los códigos exactamente como figuran, como texto, aunque sean solo números.
6. Usá pocas categorías, con el mismo criterio en todo el listado. No inventes categorías de más.
7. Si el catálogo está en PDF, imagen o tabla desordenada, reconstruí cada fila sin mezclar productos ni precios.
8. Para "imagen" usá solo URLs de imágenes que aparezcan en el catálogo o en la web del proveedor. No inventes enlaces, no uses rutas relativas, no generes imágenes y no devuelvas datos base64.
9. No agregues campos extra, no envuelvas el array en un objeto y no uses comas finales.

EJEMPLO DE SALIDA

```json
[
  {
    "nombre": "Lana merino 100 g",
    "codigo": "LM-100",
    "categoria": "Lanas",
    "costo": 4500.5,
    "unidad": "unidad",
    "moq": 6,
    "link": "https://ejemplo.com/producto/lana-merino-100g",
    "imagen": "https://ejemplo.com/img/lana-merino-100g.jpg",
    "notas": "Colores surtidos"
  },
  {
    "nombre": "Aguja circular 4 mm",
    "codigo": null,
    "categoria": "Accesorios",
    "costo": 3200,
    "unidad": "unidad",
    "moq": null,
    "link": null,
    "imagen": null,
    "notas": null
  }
]
```

---

## Notas

- El JSON se puede pegar con o sin el bloque de código de markdown: la app lo limpia.
- También acepta un objeto con la forma `{ "productos": [ ... ] }`.
- Los campos se reconocen por nombre; además de los de arriba se aceptan alias como `precio`,
  `sku`, `category`, `unit`, `url`, `image` o `notes`.
- La imagen se importa como URL (http/https). No se pueden importar archivos de imagen dentro del
  JSON; si el catálogo no trae URLs, las fotos se agregan después desde Editar producto.
- Si ya tenés el dato, `imagen` también acepta base64 puro, `data:image/...;base64,...` o un objeto
  `{ "base64": "...", "mimeType": "image/jpeg" }`. La app lo optimiza antes de guardarlo. No le
  pidas base64 a la IA: no puede reconstruir la foto real de un PDF o una captura.
- Antes de guardar, la app muestra una vista previa y detecta duplicados por código o por nombre.
  Podés elegir omitirlos o actualizar sus datos y costo.
