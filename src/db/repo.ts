import type {
  ContactoInput,
  Pedido,
  PedidoInput,
  PedidoItem,
  Producto,
  ProductoInput,
  Proveedor,
  ProveedorInput,
} from '../types'
import { db, newId, nowISO, todayISO } from './db'

export async function saveProveedor(input: ProveedorInput, id?: string): Promise<string> {
  const now = nowISO()
  if (id) {
    const prev = await db.proveedores.get(id)
    if (!prev) throw new Error('El proveedor no existe')
    await db.proveedores.put({ ...prev, ...input, id, updatedAt: now })
    return id
  }
  const proveedor: Proveedor = { ...input, id: newId(), createdAt: now, updatedAt: now }
  await db.proveedores.add(proveedor)
  return proveedor.id
}

export async function deleteProveedor(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.proveedores,
    db.contactos,
    db.productos,
    db.pedidos,
    db.items,
    async () => {
      const pedidoIds = await db.pedidos.where('proveedorId').equals(id).primaryKeys()
      if (pedidoIds.length > 0) {
        await db.items.where('pedidoId').anyOf(pedidoIds).delete()
      }
      await db.pedidos.where('proveedorId').equals(id).delete()
      await db.contactos.where('proveedorId').equals(id).delete()
      await db.productos.where('proveedorId').equals(id).delete()
      await db.proveedores.delete(id)
    },
  )
}

export async function registrarContacto(id: string): Promise<void> {
  await db.proveedores.update(id, {
    ultimoContacto: todayISO(),
    updatedAt: nowISO(),
  })
}

export async function saveContacto(input: ContactoInput, id?: string): Promise<void> {
  if (id) {
    const prev = await db.contactos.get(id)
    if (!prev) throw new Error('El contacto no existe')
    await db.contactos.put({ ...prev, ...input, id })
    return
  }
  await db.contactos.add({ ...input, id: newId() })
}

export async function deleteContacto(id: string): Promise<void> {
  await db.contactos.delete(id)
}

export async function saveProducto(input: ProductoInput, id?: string): Promise<string> {
  if (id) {
    const prev = await db.productos.get(id)
    if (!prev) throw new Error('El producto no existe')
    await db.productos.put({ ...prev, ...input, id })
    return id
  }
  const producto: Producto = { ...input, id: newId(), createdAt: nowISO() }
  await db.productos.add(producto)
  return producto.id
}

export async function deleteProducto(id: string): Promise<void> {
  await db.productos.delete(id)
}

export async function crearPedido(proveedorId: string, input: PedidoInput): Promise<string> {
  const now = nowISO()
  const pedido: Pedido = { ...input, proveedorId, id: newId(), createdAt: now, updatedAt: now }
  await db.pedidos.add(pedido)
  return pedido.id
}

export async function updatePedido(pedido: Pedido): Promise<void> {
  await db.pedidos.put({ ...pedido, updatedAt: nowISO() })
}

export async function savePedido(pedido: Pedido, items: PedidoItem[]): Promise<void> {
  const updatedAt = nowISO()
  await db.transaction('rw', db.pedidos, db.items, async () => {
    await db.pedidos.put({ ...pedido, updatedAt })
    const existing = (await db.items.where('pedidoId').equals(pedido.id).primaryKeys()) as string[]
    const keep = new Set(items.map((item) => item.id))
    const remove = existing.filter((key) => !keep.has(String(key)))
    if (remove.length > 0) {
      await db.items.bulkDelete(remove)
    }
    if (items.length > 0) {
      await db.items.bulkPut(items.map((item) => ({ ...item, pedidoId: pedido.id })))
    }
  })
}

export async function deletePedido(id: string): Promise<void> {
  await db.transaction('rw', db.pedidos, db.items, async () => {
    await db.items.where('pedidoId').equals(id).delete()
    await db.pedidos.delete(id)
  })
}

export async function duplicarPedido(id: string): Promise<string> {
  const original = await db.pedidos.get(id)
  if (!original) throw new Error('El pedido no existe')
  const items = await db.items.where('pedidoId').equals(id).toArray()
  const newPedidoId = newId()
  const now = nowISO()
  const copia: Pedido = {
    ...original,
    id: newPedidoId,
    referencia: original.referencia ? `${original.referencia} (copia)` : 'Copia',
    estado: 'interesado',
    fecha: todayISO(),
    createdAt: now,
    updatedAt: now,
  }
  const copiaItems: PedidoItem[] = items.map((item) => ({
    ...item,
    id: newId(),
    pedidoId: newPedidoId,
  }))
  await db.transaction('rw', db.pedidos, db.items, async () => {
    await db.pedidos.add(copia)
    if (copiaItems.length > 0) {
      await db.items.bulkAdd(copiaItems)
    }
  })
  return newPedidoId
}

export async function clearData(): Promise<void> {
  await db.transaction(
    'rw',
    db.proveedores,
    db.contactos,
    db.productos,
    db.pedidos,
    db.items,
    async () => {
      await db.items.clear()
      await db.pedidos.clear()
      await db.productos.clear()
      await db.contactos.clear()
      await db.proveedores.clear()
    },
  )
}
