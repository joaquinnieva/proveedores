import type { Pedido, PedidoItem, Proveedor, Settings } from '../types'
import { formatDate, formatMoney } from './format'

export function itemSubtotal(item: PedidoItem): number {
  const cantidad = Number(item.cantidad)
  const precio = Number(item.precioUnitario)
  return (Number.isFinite(cantidad) ? cantidad : 0) * (Number.isFinite(precio) ? precio : 0)
}

export function pedidoTotal(items: PedidoItem[]): number {
  return items.reduce((total, item) => total + itemSubtotal(item), 0)
}

export function buildPedidoText(options: {
  pedido: Pedido
  proveedor: Proveedor
  items: PedidoItem[]
  settings: Settings
}): string {
  const { pedido, proveedor, items, settings } = options
  const lines: string[] = []
  lines.push(`Pedido para ${proveedor.nombre}`)
  if (pedido.referencia) lines.push(`Referencia: ${pedido.referencia}`)
  lines.push(`Fecha: ${formatDate(pedido.fecha)}`)
  if (pedido.fechaDeseada) lines.push(`Fecha deseada: ${formatDate(pedido.fechaDeseada)}`)
  lines.push('')
  if (items.length === 0) {
    lines.push('(Sin ítems cargados)')
  } else {
    for (const item of items) {
      const unidad = item.unidad ? ` ${item.unidad}` : ''
      lines.push(
        `- ${item.descripcion || 'Ítem sin descripción'} x${item.cantidad}${unidad} — ${formatMoney(
          itemSubtotal(item),
          settings,
        )}`,
      )
    }
  }
  lines.push('')
  lines.push(`Total: ${formatMoney(pedidoTotal(items), settings)}`)
  if (pedido.notas) {
    lines.push('')
    lines.push(`Notas: ${pedido.notas}`)
  }
  return lines.join('\n')
}

export function normalizePhone(phone: string | undefined): string {
  return (phone ?? '').replace(/\D/g, '')
}

export function whatsappLink(phone: string | undefined, text: string): string | undefined {
  const digits = normalizePhone(phone)
  if (!digits) return undefined
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function pedidoSubject(pedido: Pedido, proveedor: Proveedor): string {
  const reference = pedido.referencia ? ` ${pedido.referencia}` : ''
  return `Pedido${reference} — ${proveedor.nombre}`
}

export function mailtoLink(
  email: string | undefined,
  subject: string,
  body: string,
): string | undefined {
  const cleaned = (email ?? '').trim()
  if (!cleaned) return undefined
  return `mailto:${cleaned}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
