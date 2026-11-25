import type {
  CanalPedido,
  EstadoPedido,
  EstadoProveedor,
  PrioridadPedido,
  Settings,
} from '../types'

export type Tone = 'neutral' | 'success' | 'warning' | 'info' | 'accent' | 'danger'

export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  interesado: 'Interesado',
  por_pedir: 'Por pedir',
  pedido: 'Pedido',
  confirmado: 'Confirmado',
  recibido: 'Recibido',
  cancelado: 'Cancelado',
}

export const ESTADO_PEDIDO_TONE: Record<EstadoPedido, Tone> = {
  interesado: 'info',
  por_pedir: 'warning',
  pedido: 'accent',
  confirmado: 'success',
  recibido: 'success',
  cancelado: 'neutral',
}

export const ESTADO_PROVEEDOR_LABEL: Record<EstadoProveedor, string> = {
  activo: 'Activo',
  pausado: 'Pausado',
}

export const CANAL_LABEL: Record<CanalPedido, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
  email: 'Email',
  feria: 'Feria',
  otro: 'Otro',
}

export const PRIORIDAD_LABEL: Record<PrioridadPedido, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
}

export const PRIORIDAD_TONE: Record<PrioridadPedido, Tone> = {
  baja: 'neutral',
  media: 'info',
  alta: 'warning',
}

export function parseNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function formatMoney(
  value: number | undefined,
  settings: Pick<Settings, 'moneda' | 'locale'>,
): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0
  try {
    return new Intl.NumberFormat(settings.locale || 'es-AR', {
      style: 'currency',
      currency: settings.moneda || 'ARS',
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `$ ${amount.toFixed(2)}`
  }
}

function toLocalDate(value: string): Date {
  return new Date(value.length <= 10 ? `${value}T00:00:00` : value)
}

export function formatDate(value?: string): string {
  if (!value) return '—'
  const date = toLocalDate(value)
  if (Number.isNaN(date.getTime())) return value
  try {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date)
  } catch {
    return value
  }
}

export function isPastDate(value?: string): boolean {
  if (!value) return false
  const date = toLocalDate(value)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function parseTags(value: string): string[] {
  const tags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  return Array.from(new Set(tags))
}
