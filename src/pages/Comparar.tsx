import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Trophy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  cardClass,
  cardHeaderClass,
  cardTitleClass,
  linkClass,
  pageClass,
  searchClass,
  searchInputClass,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
  toolbarClass,
} from '../components/styles'
import { Badge, EmptyState, PageHeader, TextField } from '../components/ui'
import { db, useAppSettings } from '../db/db'
import { formatMoney } from '../lib/format'
import { compararOpciones, evaluarOpcionCompra, type OpcionCompra } from '../lib/precios'
import type { Producto, Proveedor } from '../types'

const EMPTY_PROVEEDORES: Proveedor[] = []
const EMPTY_PRODUCTOS: Producto[] = []

function claveProducto(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function Comparar() {
  const proveedores = useLiveQuery(() => db.proveedores.toArray(), [], EMPTY_PROVEEDORES)
  const productos = useLiveQuery(() => db.productos.toArray(), [], EMPTY_PRODUCTOS)
  const settings = useAppSettings()

  const [search, setSearch] = useState('')
  const [cantidadTexto, setCantidadTexto] = useState('1')
  const cantidadDeseada = Math.max(1, Math.ceil(Number(cantidadTexto) || 1))

  const proveedoresPorId = useMemo(() => {
    const map = new Map<string, Proveedor>()
    for (const proveedor of proveedores) map.set(proveedor.id, proveedor)
    return map
  }, [proveedores])

  const grupos = useMemo(() => {
    const term = search.trim().toLowerCase()
    const gruposMap = new Map<
      string,
      { key: string; nombre: string; categoria?: string; opciones: OpcionCompra[] }
    >()

    for (const producto of productos) {
      const proveedor = proveedoresPorId.get(producto.proveedorId)
      if (!proveedor) continue

      if (term) {
        const haystack = [producto.nombre, producto.codigo, producto.categoria, proveedor.nombre]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(term)) continue
      }

      const opcion = evaluarOpcionCompra(producto, proveedor, cantidadDeseada)
      if (!opcion) continue

      const key = claveProducto(producto.nombre)
      const grupo = gruposMap.get(key) ?? {
        key,
        nombre: producto.nombre,
        categoria: producto.categoria,
        opciones: [],
      }
      grupo.opciones.push(opcion)
      gruposMap.set(key, grupo)
    }

    return [...gruposMap.values()]
      .map((grupo) => ({ ...grupo, opciones: grupo.opciones.sort(compararOpciones) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [productos, proveedoresPorId, search, cantidadDeseada])

  const productosConCosto = grupos.length

  return (
    <div className={pageClass}>
      <PageHeader
        title="Comparar compras"
        subtitle="Precio real por producto incluyendo envío, MOQ y pedido mínimo de cada proveedor."
      />

      <div className={toolbarClass}>
        <div className={searchClass}>
          <Search size={16} className="pointer-events-none absolute left-3 text-muted" />
          <input
            className={searchInputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por producto, código, categoría o proveedor…"
            aria-label="Buscar productos para comparar"
          />
        </div>
        <div className="w-full max-w-[150px]">
          <TextField
            label="Cantidad"
            value={cantidadTexto}
            onChange={setCantidadTexto}
            inputMode="numeric"
            min={1}
            type="number"
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        El total suma envío según cada proveedor. El pedido mínimo se evalúa contra el subtotal de
        este producto; si pedís varios ítems al mismo proveedor, el mínimo suele cubrirse entre
        todos.
      </p>

      {productos.length === 0 ? (
        <EmptyState
          title="Todavía no hay productos cargados"
          description="Cargá productos con su costo en la ficha de cada proveedor para poder compararlos acá."
        />
      ) : productosConCosto === 0 ? (
        <EmptyState
          title={search ? 'Sin resultados' : 'Faltan costos'}
          description={
            search
              ? 'Probá con otra búsqueda. También podés haber cargado productos sin costo.'
              : 'Ningún producto tiene costo cargado. El comparador necesita el costo unitario.'
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {' '}
          {grupos.map((grupo) => {
            const mejor = grupo.opciones[0]
            return (
              <section className={`${cardClass} p-5`} key={grupo.key}>
                <div className={cardHeaderClass}>
                  <div>
                    <h2 className={cardTitleClass}>{grupo.nombre}</h2>
                    <p className="mt-0.5 text-xs text-muted">
                      {[grupo.categoria, `${grupo.opciones.length} proveedor(es)`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {mejor.cumpleMinimo ? (
                    <Badge tone="success">
                      <Trophy size={12} />
                      Mejor: {mejor.proveedor.nombre}
                    </Badge>
                  ) : (
                    <Badge tone="warning">Ninguno llega al mínimo</Badge>
                  )}
                </div>

                <div className={tableWrapClass}>
                  <table className={tableClass}>
                    <thead>
                      <tr>
                        <th className={thClass}>Proveedor</th>
                        <th className={thClass}>Costo unit.</th>
                        <th className={thClass}>Cantidad</th>
                        <th className={thClass}>Envío</th>
                        <th className={thClass}>Total</th>
                        <th className={thClass}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.opciones.map((opcion) => {
                        const esMejor = opcion === mejor
                        return (
                          <tr key={opcion.producto.id}>
                            <td className={tdClass}>
                              <Link
                                className={linkClass}
                                to={`/proveedores/${opcion.proveedor.id}`}
                              >
                                {opcion.proveedor.nombre}
                              </Link>
                            </td>
                            <td className={tdClass}>
                              {formatMoney(opcion.producto.costo, settings)}
                              {opcion.producto.unidad ? (
                                <span className="text-muted"> / {opcion.producto.unidad}</span>
                              ) : null}
                            </td>
                            <td className={tdClass}>
                              {opcion.cantidad}
                              {opcion.producto.moq ? (
                                <span className="text-muted"> (MOQ {opcion.producto.moq})</span>
                              ) : null}
                            </td>
                            <td className={tdClass}>
                              {opcion.envio === 0 ? (
                                <span className="font-semibold text-success">Gratis</span>
                              ) : (
                                formatMoney(opcion.envio, settings)
                              )}
                            </td>
                            <td className={tdClass}>
                              <span className="font-semibold">
                                {formatMoney(opcion.total, settings)}
                              </span>
                              <span className="block text-[11.5px] text-muted">
                                {formatMoney(opcion.unitario, settings)} por unidad
                              </span>
                            </td>
                            <td className={tdClass}>
                              {esMejor && opcion.cumpleMinimo ? (
                                <Badge tone="success">Mejor opción</Badge>
                              ) : opcion.faltaMinimo !== undefined ? (
                                <Badge tone="warning">
                                  Faltan {formatMoney(opcion.faltaMinimo, settings)} para el mínimo
                                </Badge>
                              ) : (
                                <Badge tone="neutral">Opción válida</Badge>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {!mejor.cumpleMinimo ? (
                  <p className="mt-2 text-xs text-muted">
                    Ojo: el total más bajo no alcanza el pedido mínimo de ese proveedor. Podés subir
                    la cantidad para llegar.
                  </p>
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
