import type { Contacto, Pedido, PedidoItem, Producto, Proveedor, Settings } from '../types'
import { DEFAULT_SETTINGS, db } from './db'

export interface DataCounts {
  proveedores: number
  contactos: number
  productos: number
  pedidos: number
  items: number
}

export interface BackupPayload {
  app: 'proveedores'
  version: 1
  exportedAt: string
  proveedores: Proveedor[]
  contactos: Contacto[]
  productos: Producto[]
  pedidos: Pedido[]
  items: PedidoItem[]
  settings: Settings[]
}

function assertArray<T>(value: unknown, name: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`El archivo no contiene la lista "${name}".`)
  }
  return value as T[]
}

export async function buildBackup(): Promise<BackupPayload> {
  const [proveedores, contactos, productos, pedidos, items, settings] = await Promise.all([
    db.proveedores.toArray(),
    db.contactos.toArray(),
    db.productos.toArray(),
    db.pedidos.toArray(),
    db.items.toArray(),
    db.settings.toArray(),
  ])
  return {
    app: 'proveedores',
    version: 1,
    exportedAt: new Date().toISOString(),
    proveedores,
    contactos,
    productos,
    pedidos,
    items,
    settings,
  }
}

export async function exportBackup(): Promise<DataCounts> {
  const payload = await buildBackup()
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `proveedores-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return {
    proveedores: payload.proveedores.length,
    contactos: payload.contactos.length,
    productos: payload.productos.length,
    pedidos: payload.pedidos.length,
    items: payload.items.length,
  }
}

export async function importBackup(file: File): Promise<DataCounts> {
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('El archivo no tiene el formato esperado.')
  }
  const data = raw as Record<string, unknown>
  if (data.app !== 'proveedores' || data.version !== 1) {
    throw new Error('Este archivo no es un backup de Proveedores (versión 1).')
  }

  const proveedores = assertArray<Proveedor>(data.proveedores, 'proveedores')
  const contactos = assertArray<Contacto>(data.contactos, 'contactos')
  const productos = assertArray<Producto>(data.productos, 'productos')
  const pedidos = assertArray<Pedido>(data.pedidos, 'pedidos')
  const items = assertArray<PedidoItem>(data.items, 'items')
  const settings = Array.isArray(data.settings)
    ? (data.settings as Settings[]).filter(
        (item) => typeof item === 'object' && item !== null && item.id === 'app',
      )
    : []

  await db.transaction(
    'rw',
    [db.proveedores, db.contactos, db.productos, db.pedidos, db.items, db.settings],
    async () => {
      await db.items.clear()
      await db.pedidos.clear()
      await db.productos.clear()
      await db.contactos.clear()
      await db.proveedores.clear()
      await db.settings.clear()

      if (proveedores.length > 0) await db.proveedores.bulkAdd(proveedores)
      if (contactos.length > 0) await db.contactos.bulkAdd(contactos)
      if (productos.length > 0) await db.productos.bulkAdd(productos)
      if (pedidos.length > 0) await db.pedidos.bulkAdd(pedidos)
      if (items.length > 0) await db.items.bulkAdd(items)
      await db.settings.put(
        settings[0] ? { ...DEFAULT_SETTINGS, ...settings[0], id: 'app' } : DEFAULT_SETTINGS,
      )
    },
  )

  return {
    proveedores: proveedores.length,
    contactos: contactos.length,
    productos: productos.length,
    pedidos: pedidos.length,
    items: items.length,
  }
}

export async function getCounts(): Promise<DataCounts> {
  const [proveedores, contactos, productos, pedidos, items] = await Promise.all([
    db.proveedores.count(),
    db.contactos.count(),
    db.productos.count(),
    db.pedidos.count(),
    db.items.count(),
  ])
  return { proveedores, contactos, productos, pedidos, items }
}
