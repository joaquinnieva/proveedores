import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PedidoDialog } from '../components/PedidoDialog'
import {
  avatarClass,
  cardClass,
  pageClass,
  rowBadgesClass,
  searchClass,
  searchInputClass,
  segmentedClass,
  segmentedCountActiveClass,
  segmentedCountClass,
  segmentedItemActiveClass,
  segmentedItemClass,
  toolbarClass,
} from '../components/styles'
import { Badge, Button, EmptyState, PageHeader } from '../components/ui'
import { db, useAppSettings } from '../db/db'
import { cx } from '../lib/cx'
import {
  ESTADO_PEDIDO_LABEL,
  ESTADO_PEDIDO_TONE,
  formatDate,
  formatMoney,
  initials,
  isPastDate,
} from '../lib/format'
import { fadeUp, quickTransition, staggerContainer } from '../lib/motion'
import { itemSubtotal } from '../lib/pedido'
import type { EstadoPedido, Pedido, PedidoItem, Proveedor } from '../types'
import { ESTADOS_PEDIDO } from '../types'

type FiltroEstado = 'todos' | EstadoPedido

const EMPTY_PEDIDOS: Pedido[] = []
const EMPTY_PROVEEDORES: Proveedor[] = []
const EMPTY_ITEMS: PedidoItem[] = []

export function Pedidos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const settings = useAppSettings()
  const pedidos = useLiveQuery(() => db.pedidos.toArray(), [], EMPTY_PEDIDOS)
  const proveedores = useLiveQuery(() => db.proveedores.toArray(), [], EMPTY_PROVEEDORES)
  const items = useLiveQuery(() => db.items.toArray(), [], EMPTY_ITEMS)

  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)

  const nuevoEnUrl = searchParams.get('nuevo') === '1'
  const crearOpen = dialogOpen || nuevoEnUrl

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open && nuevoEnUrl) {
      const next = new URLSearchParams(searchParams)
      next.delete('nuevo')
      setSearchParams(next, { replace: true })
    }
  }

  const proveedoresPorId = useMemo(
    () => new Map(proveedores.map((item) => [item.id, item])),
    [proveedores],
  )

  const resumenPorPedido = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    for (const item of items) {
      const prev = map.get(item.pedidoId) ?? { count: 0, total: 0 }
      map.set(item.pedidoId, {
        count: prev.count + 1,
        total: prev.total + itemSubtotal(item),
      })
    }
    return map
  }, [items])

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase()
    return pedidos
      .filter((pedido) => {
        if (filtro !== 'todos' && pedido.estado !== filtro) return false
        if (!term) return true
        const proveedor = proveedoresPorId.get(pedido.proveedorId)
        const haystack = [pedido.referencia, pedido.notas, proveedor?.nombre]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
      .sort((a, b) => {
        const byDate = b.fecha.localeCompare(a.fecha)
        return byDate !== 0 ? byDate : b.createdAt.localeCompare(a.createdAt)
      })
  }, [pedidos, filtro, search, proveedoresPorId])

  const conteos = useMemo(() => {
    const map = new Map<EstadoPedido, number>()
    for (const pedido of pedidos) {
      map.set(pedido.estado, (map.get(pedido.estado) ?? 0) + 1)
    }
    return map
  }, [pedidos])

  return (
    <div className={pageClass}>
      <PageHeader
        title="Pedidos"
        subtitle={`${pedidos.length} ${pedidos.length === 1 ? 'pedido guardado' : 'pedidos guardados'}`}
        actions={
          <Button variant="primary" type="button" onClick={() => setDialogOpen(true)}>
            <Plus size={16} />
            Nuevo pedido
          </Button>
        }
      />

      <div className={toolbarClass}>
        <div className={searchClass}>
          <Search size={16} className="pointer-events-none absolute left-3 text-muted" />
          <input
            className={searchInputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por referencia, proveedor o nota…"
            aria-label="Buscar pedidos"
          />
        </div>
      </div>

      <fieldset className={cx(segmentedClass, 'overflow-x-auto')} aria-label="Filtrar por estado">
        <button
          type="button"
          className={filtro === 'todos' ? segmentedItemActiveClass : segmentedItemClass}
          aria-pressed={filtro === 'todos'}
          onClick={() => setFiltro('todos')}
        >
          Todos{' '}
          <span className={filtro === 'todos' ? segmentedCountActiveClass : segmentedCountClass}>
            {pedidos.length}
          </span>
        </button>
        {ESTADOS_PEDIDO.map((estado) => {
          const count = conteos.get(estado) ?? 0
          return (
            <button
              key={estado}
              type="button"
              className={filtro === estado ? segmentedItemActiveClass : segmentedItemClass}
              aria-pressed={filtro === estado}
              onClick={() => setFiltro(estado)}
            >
              {ESTADO_PEDIDO_LABEL[estado]}
              {count > 0 ? (
                <span
                  className={filtro === estado ? segmentedCountActiveClass : segmentedCountClass}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </fieldset>

      {pedidos.length === 0 ? (
        <EmptyState
          title="Todavía no hay pedidos"
          description="Creá un pedido, agregá productos y guardalo para pedirlo cuando quieras."
          action={
            <Button variant="primary" type="button" onClick={() => setDialogOpen(true)}>
              <Plus size={16} />
              Nuevo pedido
            </Button>
          }
        />
      ) : filtrados.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Probá con otra búsqueda o cambiá el filtro de estado."
        />
      ) : (
        <motion.div
          className="flex flex-col gap-2.5"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {filtrados.map((pedido) => {
            const proveedor = proveedoresPorId.get(pedido.proveedorId)
            const resumen = resumenPorPedido.get(pedido.id)
            const vencido =
              pedido.fechaDeseada &&
              isPastDate(pedido.fechaDeseada) &&
              pedido.estado !== 'recibido' &&
              pedido.estado !== 'cancelado'
            return (
              <motion.div
                key={pedido.id}
                variants={fadeUp}
                transition={quickTransition}
                whileHover={{ y: -2 }}
              >
                <Link
                  className={cx(
                    cardClass,
                    'flex items-center gap-3.5 px-4 py-3.5 transition-[border-color,transform] hover:border-accent max-[700px]:flex-wrap',
                  )}
                  to={`/pedidos/${pedido.id}`}
                >
                  <span className={avatarClass}>{initials(proveedor?.nombre ?? '?')}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-semibold">
                      {pedido.referencia || 'Pedido sin referencia'}
                    </span>
                    <span className="text-[12.5px] text-muted">
                      {proveedor?.nombre ?? 'Proveedor'} · {formatDate(pedido.fecha)}
                      {pedido.fechaDeseada ? ` · para ${formatDate(pedido.fechaDeseada)}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-right max-[700px]:text-left">
                    <span className="text-[13.5px] font-bold">
                      {formatMoney(resumen?.total ?? 0, settings)}
                    </span>
                    <span className="text-[11.5px] text-muted">{resumen?.count ?? 0} ítems</span>
                  </div>
                  <div className={rowBadgesClass}>
                    {vencido ? <Badge tone="danger">Vencido</Badge> : null}
                    <Badge tone={ESTADO_PEDIDO_TONE[pedido.estado]}>
                      {ESTADO_PEDIDO_LABEL[pedido.estado]}
                    </Badge>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {crearOpen ? (
        <PedidoDialog open onOpenChange={handleDialogOpenChange} proveedores={proveedores} />
      ) : null}
    </div>
  )
}
