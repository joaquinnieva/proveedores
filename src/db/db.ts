import Dexie, { type EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Contacto, Pedido, PedidoItem, Producto, Proveedor, Settings } from '../types'

export class ProveedoresDB extends Dexie {
  proveedores!: EntityTable<Proveedor, 'id'>
  contactos!: EntityTable<Contacto, 'id'>
  productos!: EntityTable<Producto, 'id'>
  pedidos!: EntityTable<Pedido, 'id'>
  items!: EntityTable<PedidoItem, 'id'>
  settings!: EntityTable<Settings, 'id'>

  constructor() {
    super('proveedores')
    this.version(1).stores({
      proveedores: 'id, nombre, rubro, estado, updatedAt, *etiquetas',
      contactos: 'id, proveedorId, nombre',
      productos: 'id, proveedorId, nombre, categoria',
      pedidos: 'id, proveedorId, estado, fecha, createdAt, updatedAt',
      items: 'id, pedidoId, productoId',
      settings: 'id',
    })
  }
}

export const db = new ProveedoresDB()

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  nombreNegocio: '',
  moneda: 'ARS',
  locale: 'es-AR',
  margenGanancia: 0,
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function todayISO(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? DEFAULT_SETTINGS
}

export function useAppSettings(): Settings {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  return settings ?? DEFAULT_SETTINGS
}

export async function saveSettings(settings: Settings): Promise<void> {
  await db.settings.put({ ...settings, id: 'app' })
}
