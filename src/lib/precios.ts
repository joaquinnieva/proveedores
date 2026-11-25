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
