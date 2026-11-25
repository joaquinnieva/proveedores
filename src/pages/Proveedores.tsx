import { useLiveQuery } from 'dexie-react-hooks'
import { Mail, MessageCircle, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ProveedorDialog } from '../components/ProveedorDialog'
import {
  avatarClass,
  buttonClass,
  cardClass,
  chipsClass,
  iconButtonClass,
  pageClass,
  searchClass,
  searchInputClass,
  segmentedClass,
  segmentedItemActiveClass,
  segmentedItemClass,
  tagClass,
  toolbarClass,
} from '../components/styles'
import { Badge, Button, ConfirmDialog, EmptyState, IconButton, PageHeader } from '../components/ui'
import { db } from '../db/db'
import { deleteProveedor, registrarContacto } from '../db/repo'
import { cx } from '../lib/cx'
import { ESTADO_PROVEEDOR_LABEL, initials } from '../lib/format'
import { fadeUp, quickTransition, staggerContainer } from '../lib/motion'
import type { EstadoProveedor, Pedido, Producto, Proveedor } from '../types'

type FiltroEstado = 'todos' | EstadoProveedor

const EMPTY_PROVEEDORES: Proveedor[] = []
const EMPTY_PRODUCTOS: Producto[] = []
const EMPTY_PEDIDOS: Pedido[] = []

const FILTROS: { value: FiltroEstado; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'pausado', label: 'Pausados' },
]

export function Proveedores() {
  const [searchParams, setSearchParams] = useSearchParams()
  const proveedores = useLiveQuery(() => db.proveedores.toArray(), [], EMPTY_PROVEEDORES)
  const productos = useLiveQuery(() => db.productos.toArray(), [], EMPTY_PRODUCTOS)
  const pedidos = useLiveQuery(() => db.pedidos.toArray(), [], EMPTY_PEDIDOS)

  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [borrar, setBorrar] = useState<Proveedor | null>(null)

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

  const productosPorProveedor = useMemo(() => {
    const counts = new Map<string, number>()
    for (const producto of productos) {
      counts.set(producto.proveedorId, (counts.get(producto.proveedorId) ?? 0) + 1)
    }
    return counts
  }, [productos])

  const pedidosPorProveedor = useMemo(() => {
    const counts = new Map<string, number>()
    for (const pedido of pedidos) {
      counts.set(pedido.proveedorId, (counts.get(pedido.proveedorId) ?? 0) + 1)
    }
    return counts
  }, [pedidos])

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase()
    return proveedores
      .filter((proveedor) => {
        if (filtro !== 'todos' && proveedor.estado !== filtro) return false
        if (!term) return true
        const haystack = [
          proveedor.nombre,
          proveedor.rubro,
          proveedor.zona,
          proveedor.notas,
          ...proveedor.etiquetas,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [proveedores, filtro, search])

  function abrirNuevo() {
    setEditando(null)
    setDialogOpen(true)
  }

  function abrirEditar(proveedor: Proveedor) {
    setEditando(proveedor)
    setDialogOpen(true)
  }

  async function confirmarBorrado() {
    if (!borrar) return
    await deleteProveedor(borrar.id)
    setBorrar(null)
  }

  return (
    <div className={pageClass}>
      <PageHeader
        title="Proveedores"
        subtitle={`${proveedores.length} ${
          proveedores.length === 1 ? 'proveedor cargado' : 'proveedores cargados'
        }`}
        actions={
          <Button variant="primary" onClick={abrirNuevo} type="button">
            <Plus size={16} />
            Nuevo proveedor
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
            placeholder="Buscar por nombre, rubro, zona o etiqueta…"
            aria-label="Buscar proveedores"
          />
        </div>
        <fieldset className={segmentedClass} aria-label="Filtrar por estado">
          {FILTROS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cx(filtro === item.value ? segmentedItemActiveClass : segmentedItemClass)}
              aria-pressed={filtro === item.value}
              onClick={() => setFiltro(item.value)}
            >
              {item.label}
            </button>
          ))}
        </fieldset>
      </div>

      {proveedores.length === 0 ? (
        <EmptyState
          title="Todavía no hay proveedores"
          description="Cargá el primero con sus datos de contacto para empezar a guardar pedidos."
          action={
            <Button variant="primary" onClick={abrirNuevo} type="button">
              <Plus size={16} />
              Nuevo proveedor
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
          className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {filtrados.map((proveedor) => {
            const whatsapp = (proveedor.whatsapp ?? proveedor.telefono ?? '').replace(/\D/g, '')
            const email = proveedor.email?.trim()
            return (
              <motion.article
                variants={fadeUp}
                transition={quickTransition}
                whileHover={{ y: -2 }}
                className={`${cardClass} flex flex-col gap-0.5 p-5`}
                key={proveedor.id}
              >
                <div className="flex items-center gap-3">
                  <span className={avatarClass}>{initials(proveedor.nombre)}</span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      className="text-[14.5px] font-semibold hover:text-accent-ink"
                      to={`/proveedores/${proveedor.id}`}
                    >
                      {proveedor.nombre}
                    </Link>
                    <span className="text-xs text-muted [overflow-wrap:anywhere]">
                      {[proveedor.rubro, proveedor.zona].filter(Boolean).join(' · ') || 'Sin rubro'}
                    </span>
                  </div>
                  <Badge tone={proveedor.estado === 'activo' ? 'success' : 'neutral'}>
                    {ESTADO_PROVEEDOR_LABEL[proveedor.estado]}
                  </Badge>
                </div>

                {proveedor.etiquetas.length > 0 ? (
                  <div className={chipsClass}>
                    {proveedor.etiquetas.map((tag) => (
                      <span className={tagClass} key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto flex gap-3.5 border-t border-line pt-2.5 text-xs text-muted">
                  <span>{productosPorProveedor.get(proveedor.id) ?? 0} productos</span>
                  <span>{pedidosPorProveedor.get(proveedor.id) ?? 0} pedidos</span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {whatsapp ? (
                    <a
                      className={iconButtonClass}
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`WhatsApp de ${proveedor.nombre}`}
                      title="Abrir WhatsApp"
                      onClick={() => void registrarContacto(proveedor.id)}
                    >
                      <MessageCircle size={16} />
                    </a>
                  ) : null}
                  {email ? (
                    <a
                      className={iconButtonClass}
                      href={`mailto:${email}`}
                      aria-label={`Email de ${proveedor.nombre}`}
                      title="Enviar email"
                      onClick={() => void registrarContacto(proveedor.id)}
                    >
                      <Mail size={16} />
                    </a>
                  ) : null}
                  <Link
                    className={buttonClass('secondary', 'sm')}
                    to={`/proveedores/${proveedor.id}`}
                  >
                    Ver ficha
                  </Link>
                  <IconButton label="Editar proveedor" onClick={() => abrirEditar(proveedor)}>
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton label="Eliminar proveedor" onClick={() => setBorrar(proveedor)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      )}

      {crearOpen ? (
        <ProveedorDialog open onOpenChange={handleDialogOpenChange} proveedor={editando} />
      ) : null}

      <ConfirmDialog
        open={borrar !== null}
        onOpenChange={(open) => {
          if (!open) setBorrar(null)
        }}
        title="Eliminar proveedor"
        description={
          borrar
            ? `Se va a eliminar "${borrar.nombre}" junto con sus contactos, productos y pedidos. Esta acción no se puede deshacer.`
            : undefined
        }
        onConfirm={confirmarBorrado}
      />
    </div>
  )
}
