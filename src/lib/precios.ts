import type { Producto, Proveedor } from '../types'

export interface CalculoPrecio {
  venta: number
  ganancia: number
}

export function calcularPrecioVenta(
  costo: number | undefined,
  margenPct: number | undefined,
): CalculoPrecio | undefined {
  if (typeof costo !== 'number' || !Number.isFinite(costo) || costo <= 0) return undefined
  if (typeof margenPct !== 'number' || !Number.isFinite(margenPct) || margenPct <= 0) {
    return undefined
  }
  const venta = costo * (1 + margenPct / 100)
  return { venta, ganancia: venta - costo }
}

export interface OpcionCompra {
  producto: Producto
  proveedor: Proveedor
  cantidad: number
  subtotal: number
  envio: number
  total: number
  unitario: number
  faltaMinimo?: number
  cumpleMinimo: boolean
}

export function evaluarOpcionCompra(
  producto: Producto,
  proveedor: Proveedor,
  cantidadDeseada: number,
): OpcionCompra | undefined {
  const costo = producto.costo
  if (typeof costo !== 'number' || !Number.isFinite(costo) || costo <= 0) return undefined

  const cantidad = Math.max(1, Math.ceil(cantidadDeseada), producto.moq ?? 0)
  const subtotal = costo * cantidad
  const minimo = proveedor.pedidoMinimo
  const faltaMinimo =
    typeof minimo === 'number' && subtotal < minimo ? minimo - subtotal : undefined
  const envio =
    typeof proveedor.envioGratisDesde === 'number' && subtotal >= proveedor.envioGratisDesde
      ? 0
      : (proveedor.costoEnvio ?? 0)
  const total = subtotal + envio

  return {
    producto,
    proveedor,
    cantidad,
    subtotal,
    envio,
    total,
    unitario: total / cantidad,
    faltaMinimo,
    cumpleMinimo: faltaMinimo === undefined,
  }
}

export function compararOpciones(a: OpcionCompra, b: OpcionCompra): number {
  if (a.cumpleMinimo !== b.cumpleMinimo) return a.cumpleMinimo ? -1 : 1
  return a.total - b.total
}
