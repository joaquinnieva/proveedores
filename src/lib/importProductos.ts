import type { Producto } from '../types'

export interface ProductoImportado {
  nombre: string
  codigo?: string
  categoria?: string
  costo?: number
  unidad?: string
  moq?: number
  link?: string
  imagen?: string
  notas?: string
}

export interface FilaImportada {
  indice: number
  producto?: ProductoImportado
  error?: string
}

export interface ParseResult {
  filas: FilaImportada[]
  error?: string
}

export type ModoImportacion = 'omitir' | 'actualizar'
export type EstadoPlan = 'crear' | 'actualizar' | 'omitir' | 'error'

export interface FilaPlan {
  indice: number
  estado: EstadoPlan
  producto?: ProductoImportado
  existenteId?: string
  existenteNombre?: string
  mensaje?: string
  /** La quitó el usuario desde la vista previa (no se guarda). */
  excluida?: boolean
}

export interface ResultadoImportacion {
  creados: number
  actualizados: number
  omitidos: number
}

const CAMPOS = {
  nombre: ['nombre', 'name', 'producto', 'descripcion', 'detalle'],
  codigo: ['codigo', 'sku', 'code', 'referencia', 'ref', 'cod'],
  categoria: ['categoria', 'category', 'rubro', 'familia', 'grupo'],
  costo: ['costo', 'cost', 'precio', 'price', 'preciocosto', 'preciounitario'],
  unidad: ['unidad', 'unit', 'unidaddemedida', 'medida', 'presentacion'],
  moq: ['moq', 'minimo', 'cantidadminima', 'min', 'minimumorderquantity'],
  link: ['link', 'url', 'enlace', 'linkproducto'],
  imagen: ['imagen', 'image', 'foto', 'img', 'imagenurl', 'urlimagen', 'fotoproducto'],
  notas: ['notas', 'notes', 'observaciones', 'comentarios', 'variantes'],
} as const

type Campo = keyof typeof CAMPOS

const ALIAS = new Map<string, Campo>()
for (const campo of Object.keys(CAMPOS) as Campo[]) {
  for (const alias of CAMPOS[campo]) ALIAS.set(alias, campo)
}

function normalizarClave(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function claveProducto(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function texto(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const limpio = value.trim()
    return limpio === '' ? undefined : limpio
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

export function parsearNumero(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string') return undefined
  let limpio = value.trim()
  if (!limpio) return undefined
  limpio = limpio.replace(/[^\d.,-]/g, '')
  if (!limpio || limpio === '-') return undefined

  const tieneComa = limpio.includes(',')
  const tienePunto = limpio.includes('.')
  if (tieneComa && tienePunto) {
    limpio =
      limpio.lastIndexOf(',') > limpio.lastIndexOf('.')
        ? limpio.replace(/\./g, '').replace(',', '.')
        : limpio.replace(/,/g, '')
  } else if (tieneComa) {
    const partes = limpio.split(',')
    if (partes.length > 2) limpio = limpio.replace(/,/g, '')
    else if (partes[1].length === 3 && partes[0].length <= 3) limpio = limpio.replace(',', '')
    else limpio = limpio.replace(',', '.')
  } else if (tienePunto) {
    const partes = limpio.split('.')
    if (partes.length > 2) limpio = limpio.replace(/\./g, '')
    else if (partes[1].length === 3) limpio = limpio.replace('.', '')
  }

  const numero = Number(limpio)
  return Number.isFinite(numero) ? numero : undefined
}

function extraerJson(textoOriginal: string): string {
  let valor = textoOriginal.replace(/^\uFEFF/, '').trim()
  valor = valor
    .replace(/```[a-zA-Z]*\s*/g, '')
    .replace(/```/g, '')
    .trim()
  const inicio = valor.search(/[[{]/)
  if (inicio > 0) valor = valor.slice(inicio)
  const fin = Math.max(valor.lastIndexOf(']'), valor.lastIndexOf('}'))
  if (fin >= 0) valor = valor.slice(0, fin + 1)
  return valor.trim()
}

function comoLista(raw: unknown): unknown[] | undefined {
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'object' || raw === null) return undefined
  const data = raw as Record<string, unknown>
  for (const llave of ['productos', 'items', 'products', 'lista', 'data']) {
    if (Array.isArray(data[llave])) return data[llave] as unknown[]
  }
  if ('nombre' in data || 'name' in data) return [data]
  return undefined
}

function tipoDesdeBase64(base64: string): string | undefined {
  if (base64.startsWith('/9j/')) return 'image/jpeg'
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png'
  if (base64.startsWith('R0lGOD')) return 'image/gif'
  if (base64.startsWith('UklGR')) return 'image/webp'
  if (base64.startsWith('Qk')) return 'image/bmp'
  if (base64.startsWith('AAAAIGZ0eXBhdmlm')) return 'image/avif'
  return undefined
}

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/

function normalizarBase64(contenido: string, mime?: string): string | undefined {
  const dataUrl = /^data:([^;,]+)?;base64,(.*)$/is.exec(contenido.trim())
  const limpio = (dataUrl ? dataUrl[2] : contenido)
    .replace(/^base64[:;,]\s*/i, '')
    .replace(/\s+/g, '')
  if (limpio.length < 32 || !BASE64_RE.test(limpio)) return undefined
  const tipo =
    mime && /^image\//i.test(mime)
      ? mime
      : dataUrl?.[1]?.startsWith('image/')
        ? dataUrl[1]
        : tipoDesdeBase64(limpio)
  if (!tipo) return undefined
  return `data:${tipo};base64,${limpio}`
}

function normalizarImagen(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null) {
    const data = value as Record<string, unknown>
    const contenido = texto(data.base64 ?? data.data ?? data.contenido ?? data.src)
    if (!contenido) return undefined
    const mime = texto(data.mimeType ?? data.mime ?? data.tipo ?? data.type)
    return normalizarBase64(contenido, mime)
  }

  const limpio = texto(value)
  if (!limpio) return undefined
  if (limpio.startsWith('//')) return `https:${limpio}`
  if (/^https?:\/\//i.test(limpio)) return limpio
  if (/^data:image\//i.test(limpio)) return normalizarBase64(limpio) ?? limpio
  return normalizarBase64(limpio)
}

function normalizarProducto(raw: unknown): ProductoImportado | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined
  const data = raw as Record<string, unknown>
  const valores: Partial<Record<Campo, unknown>> = {}
  for (const [llave, valor] of Object.entries(data)) {
    const campo = ALIAS.get(normalizarClave(llave))
    if (campo && valores[campo] === undefined) valores[campo] = valor
  }

  const nombre = texto(valores.nombre)
  if (!nombre) return undefined

  const costo = parsearNumero(valores.costo)
  const moq = parsearNumero(valores.moq)

  return {
    nombre,
    codigo: texto(valores.codigo),
    categoria: texto(valores.categoria),
    costo: typeof costo === 'number' && costo >= 0 ? costo : undefined,
    unidad: texto(valores.unidad),
    moq: typeof moq === 'number' && moq >= 0 ? moq : undefined,
    link: texto(valores.link),
    imagen: normalizarImagen(valores.imagen),
    notas: texto(valores.notas),
  }
}

export function parsearImportacion(textoOriginal: string): ParseResult {
  if (!textoOriginal.trim()) {
    return { filas: [], error: 'Pegá el JSON con los productos.' }
  }

  let raw: unknown
  try {
    raw = JSON.parse(extraerJson(textoOriginal))
  } catch {
    return {
      filas: [],
      error: 'El texto no es un JSON válido. Revisá que no falten comas, corchetes o comillas.',
    }
  }

  const lista = comoLista(raw)
  if (!lista) {
    return {
      filas: [],
      error: 'El JSON debe ser una lista de productos (un array entre corchetes).',
    }
  }

  const filas = lista.map((item, posicion): FilaImportada => {
    const producto = normalizarProducto(item)
    if (!producto) {
      return {
        indice: posicion + 1,
        error: 'Falta el nombre del producto o el formato de la fila es incorrecto.',
      }
    }
    return { indice: posicion + 1, producto }
  })

  return { filas }
}

function claveDe(producto: ProductoImportado): string | undefined {
  if (producto.codigo) return `codigo:${claveProducto(producto.codigo)}`
  return `nombre:${claveProducto(producto.nombre)}`
}

function claveExistente(producto: Producto): string | undefined {
  if (producto.codigo) return `codigo:${claveProducto(producto.codigo)}`
  return `nombre:${claveProducto(producto.nombre)}`
}

export function planificarImportacion(
  filas: FilaImportada[],
  existentes: Producto[],
  modo: ModoImportacion,
): FilaPlan[] {
  const porClave = new Map<string, Producto>()
  for (const existente of existentes) {
    const clave = claveExistente(existente)
    if (clave && !porClave.has(clave)) porClave.set(clave, existente)
  }

  const vistos = new Map<string, number>()

  return filas.map((fila) => {
    if (!fila.producto) {
      return {
        indice: fila.indice,
        estado: 'error',
        mensaje: fila.error ?? 'Fila inválida.',
      }
    }

    const clave = claveDe(fila.producto)
    const repetidaEn = clave ? vistos.get(clave) : undefined
    if (clave && repetidaEn !== undefined) {
      return {
        indice: fila.indice,
        estado: 'error',
        producto: fila.producto,
        mensaje: `Está repetido en la importación (fila ${repetidaEn}).`,
      }
    }
    if (clave) vistos.set(clave, fila.indice)

    const existente = clave ? porClave.get(clave) : undefined
    if (!existente) {
      return { indice: fila.indice, estado: 'crear', producto: fila.producto }
    }

    if (modo === 'omitir') {
      return {
        indice: fila.indice,
        estado: 'omitir',
        producto: fila.producto,
        existenteId: existente.id,
        existenteNombre: existente.nombre,
        mensaje: 'Ya existe en el catálogo.',
      }
    }

    return {
      indice: fila.indice,
      estado: 'actualizar',
      producto: fila.producto,
      existenteId: existente.id,
      existenteNombre: existente.nombre,
      mensaje: `Se actualiza "${existente.nombre}".`,
    }
  })
}

export function resumirPlan(plan: FilaPlan[]) {
  return {
    crear: plan.filter((fila) => fila.estado === 'crear').length,
    actualizar: plan.filter((fila) => fila.estado === 'actualizar').length,
    omitir: plan.filter((fila) => fila.estado === 'omitir').length,
    error: plan.filter((fila) => fila.estado === 'error').length,
  }
}

export function buildImportPrompt({
  proveedor,
  moneda,
}: {
  proveedor: string
  moneda: string
}): string {
  return `Convertí este catálogo de productos en un JSON para importarlo a mi app de proveedores.

CONTEXTO
- Proveedor: "${proveedor || 'el proveedor'}".
- Moneda de los precios: ${moneda || 'ARS'}.
- Devolveme solamente los productos de este proveedor.

FORMATO DE SALIDA (obligatorio)
- Respondé únicamente con un array JSON válido. Sin texto antes ni después, sin markdown, sin bloques de código, sin comentarios.
- Cada elemento del array es un producto con exactamente estas claves:

  "nombre":    string  Obligatorio. Nombre corto y claro del producto.
  "codigo":    string  Código, SKU o referencia del proveedor. null si no figura.
  "categoria": string  Categoría corta y consistente. null si no se puede inferir.
  "costo":     number  Precio de costo en ${moneda || 'ARS'}, sin símbolo de moneda ni separador de miles, con punto decimal. null si no figura.
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
]`
}
