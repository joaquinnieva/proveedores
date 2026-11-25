import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, PackagePlus, Pencil, Plus, RotateCcw, Save, Send, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { PedidoDialog } from '../components/PedidoDialog'
import { PedidoExport } from '../components/PedidoExport'
import { ProductoDialog } from '../components/ProductoDialog'
import {
  backLinkClass,
  buttonClass,
  buttonPrimaryClass,
  cardClass,
  cardHeaderClass,
  cardTitleClass,
  detailGridClass,
  detailWideClass,
  infoLabelClass,
  infoListClass,
  infoRowClass,
  infoValueClass,
  inputClass,
  linkClass,
  loadingClass,
  noteClass,
  pageClass,
  quickActionsClass,
  rowActionsClass,
  rowBadgesClass,
} from '../components/styles'
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  PageHeader,
  SelectField,
} from '../components/ui'
import { db, newId, useAppSettings } from '../db/db'
import { deletePedido, savePedido, updatePedido } from '../db/repo'
import { cx } from '../lib/cx'
import {
  CANAL_LABEL,
  ESTADO_PEDIDO_LABEL,
  ESTADO_PEDIDO_TONE,
  formatDate,
  formatMoney,
  isPastDate,
  PRIORIDAD_LABEL,
  PRIORIDAD_TONE,
} from '../lib/format'
import { quickTransition } from '../lib/motion'
import { itemSubtotal, pedidoTotal } from '../lib/pedido'
import type { EstadoPedido, PedidoItem, Producto, Proveedor } from '../types'
import { ESTADOS_PEDIDO } from '../types'

const EMPTY_PROVEEDORES: Proveedor[] = []
const EMPTY_PRODUCTOS: Producto[] = []
const EMPTY_ITEMS: PedidoItem[] = []

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={infoRowClass}>
      <span className={infoLabelClass}>{label}</span>
      <span className={infoValueClass}>{children}</span>
    </div>
  )
}

export function PedidoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const settings = useAppSettings()

  const loaded = useLiveQuery(async () => {
    if (!id) return { pedido: null }
    return { pedido: (await db.pedidos.get(id)) ?? null }
  }, [id])
  const pedido = loaded?.pedido ?? null

  const proveedores = useLiveQuery(() => db.proveedores.toArray(), [], EMPTY_PROVEEDORES)
  const proveedor = pedido
    ? (proveedores.find((item) => item.id === pedido.proveedorId) ?? null)
    : null

  const productos = useLiveQuery(
    () => (pedido ? db.productos.where('proveedorId').equals(pedido.proveedorId).toArray() : []),
    [pedido?.proveedorId],
    EMPTY_PRODUCTOS,
  )

  const dbItems = useLiveQuery(
    () => (id ? db.items.where('pedidoId').equals(id).toArray() : []),
    [id],
    EMPTY_ITEMS,
  )

  const [draftItems, setDraftItems] = useState<PedidoItem[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [catalogoId, setCatalogoId] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [productoOpen, setProductoOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    setDraftItems(dbItems)
    setDirty(false)
  }, [dbItems])

  const total = useMemo(() => pedidoTotal(draftItems), [draftItems])
  const itemsValidos = useMemo(
    () =>
      draftItems.filter(
        (item) =>
          item.descripcion.trim() !== '' || item.cantidad !== 0 || item.precioUnitario !== 0,
      ),
    [draftItems],
  )

  if (!loaded) {
    return <p className={loadingClass}>Cargando pedido…</p>
  }

  if (!pedido) {
    return (
      <div className={pageClass}>
        <EmptyState
          title="Pedido no encontrado"
          description="Puede que lo hayas eliminado o que el enlace esté mal."
          action={
            <Link className={buttonPrimaryClass} to="/pedidos">
              Ver pedidos
            </Link>
          }
        />
      </div>
    )
  }

  const vencido =
    pedido.fechaDeseada &&
    isPastDate(pedido.fechaDeseada) &&
    pedido.estado !== 'recibido' &&
    pedido.estado !== 'cancelado'

  function agregarManual() {
    if (!pedido) return
    setDraftItems((prev) => [
      ...prev,
      {
        id: newId(),
        pedidoId: pedido.id,
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
      },
    ])
    setDirty(true)
  }

  function agregarDesdeCatalogo(productoId: string) {
    setCatalogoId('')
    if (!productoId || !pedido) return
    const producto = productos.find((item) => item.id === productoId)
    if (!producto) return
    setDraftItems((prev) => [
      ...prev,
      {
        id: newId(),
        pedidoId: pedido.id,
        productoId: producto.id,
        descripcion: producto.nombre,
        cantidad: producto.moq ?? 1,
        precioUnitario: producto.costo ?? 0,
        unidad: producto.unidad,
      },
    ])
    setDirty(true)
  }

  function agregarProductoCreado(producto: Producto) {
    if (!pedido) return
    setDraftItems((prev) => [
      ...prev,
      {
        id: newId(),
        pedidoId: pedido.id,
        productoId: producto.id,
        descripcion: producto.nombre,
        cantidad: producto.moq ?? 1,
        precioUnitario: producto.costo ?? 0,
        unidad: producto.unidad,
      },
    ])
    setDirty(true)
  }

  function actualizarItem(itemId: string, patch: Partial<PedidoItem>) {
    setDraftItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)))
    setDirty(true)
  }

  function quitarItem(itemId: string) {
    setDraftItems((prev) => prev.filter((item) => item.id !== itemId))
    setDirty(true)
  }

  async function guardar() {
    if (!pedido) return
    setSaving(true)
    try {
      await savePedido(pedido, itemsValidos)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  async function cambiarEstado(value: string) {
    if (!pedido) return
    await updatePedido({ ...pedido, estado: value as EstadoPedido })
  }

  async function confirmarBorrado() {
    if (!pedido) return
    await deletePedido(pedido.id)
    navigate('/pedidos')
  }

  const catalogoItems = productos.map((producto) => ({
    value: producto.id,
    label: producto.costo
      ? `${producto.nombre} — ${formatMoney(producto.costo, settings)}`
      : producto.nombre,
  }))

  return (
    <div className={pageClass}>
      <Link className={backLinkClass} to="/pedidos">
        <ArrowLeft size={15} />
        Pedidos
      </Link>

      <PageHeader
        title={pedido.referencia || 'Pedido sin referencia'}
        subtitle={
          proveedor ? (
            <>
              <Link className={linkClass} to={`/proveedores/${proveedor.id}`}>
                {proveedor.nombre}
              </Link>{' '}
              · {formatDate(pedido.fecha)}
            </>
          ) : (
            formatDate(pedido.fecha)
          )
        }
        actions={
          <>
            <Button variant="primary" type="button" onClick={() => setExportOpen(true)}>
              <Send size={16} />
              Enviar
            </Button>
            <Button variant="secondary" type="button" onClick={() => setEditOpen(true)}>
              <Pencil size={16} />
              Editar datos
            </Button>
            <IconButton label="Eliminar pedido" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
            </IconButton>
          </>
        }
      />

      <div className={detailGridClass}>
        <section className={`${cardClass} p-5`}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Datos del pedido</h2>
            <div className={rowBadgesClass}>
              {vencido ? <Badge tone="danger">Vencido</Badge> : null}
              <Badge tone={ESTADO_PEDIDO_TONE[pedido.estado]}>
                {ESTADO_PEDIDO_LABEL[pedido.estado]}
              </Badge>
            </div>
          </div>

          <SelectField
            label="Estado"
            value={pedido.estado}
            onChange={(value) => void cambiarEstado(value)}
            items={ESTADOS_PEDIDO.map((estado) => ({
              value: estado,
              label: ESTADO_PEDIDO_LABEL[estado],
            }))}
          />

          <div className={infoListClass}>
            <InfoRow label="Proveedor">
              {proveedor ? (
                <Link className={linkClass} to={`/proveedores/${proveedor.id}`}>
                  {proveedor.nombre}
                </Link>
              ) : (
                '—'
              )}
            </InfoRow>
            <InfoRow label="Canal">{pedido.canal ? CANAL_LABEL[pedido.canal] : '—'}</InfoRow>
            <InfoRow label="Prioridad">
              {pedido.prioridad ? (
                <Badge tone={PRIORIDAD_TONE[pedido.prioridad]}>
                  {PRIORIDAD_LABEL[pedido.prioridad]}
                </Badge>
              ) : (
                '—'
              )}
            </InfoRow>
            <InfoRow label="Fecha">{formatDate(pedido.fecha)}</InfoRow>
            <InfoRow label="Fecha deseada">
              {pedido.fechaDeseada ? formatDate(pedido.fechaDeseada) : '—'}
            </InfoRow>
            <InfoRow label="Creado">{formatDate(pedido.createdAt)}</InfoRow>
          </div>

          {pedido.notas ? <p className={noteClass}>{pedido.notas}</p> : null}
        </section>

        <section className={`${cardClass} p-5`}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Resumen</h2>
          </div>
          <div className="mt-1 flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px] text-muted">
              <span>Ítems</span>
              <span>{draftItems.length}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-line pt-2 text-[15px] font-bold text-ink">
              <span>Total estimado</span>
              <span>{formatMoney(total, settings)}</span>
            </div>
          </div>
          <p className="text-[11.5px] text-muted">
            El total usa los precios cargados. Podés ajustarlos antes de enviar el pedido.
          </p>
          <div className={quickActionsClass}>
            <Button variant="secondary" type="button" onClick={() => setExportOpen(true)}>
              <Send size={15} />
              Generar mensaje
            </Button>
            {proveedor ? (
              <Link className={buttonClass('ghost', 'sm')} to={`/proveedores/${proveedor.id}`}>
                Ver proveedor
              </Link>
            ) : null}
          </div>
        </section>

        <section className={cx(cardClass, detailWideClass, 'p-5')}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Ítems</h2>
            <div className={rowActionsClass}>
              {dirty ? (
                <span className="text-[11.5px] font-semibold text-warning">
                  Cambios sin guardar
                </span>
              ) : null}
              {dirty ? (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setDraftItems(dbItems)
                    setDirty(false)
                  }}
                >
                  <RotateCcw size={15} />
                  Descartar
                </Button>
              ) : null}
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => void guardar()}
                disabled={!dirty || saving}
              >
                <Save size={15} />
                Guardar
              </Button>
            </div>
          </div>

          <div className="mb-3.5 flex flex-wrap items-end gap-2.5">
            <SelectField
              label="Agregar desde catálogo"
              value={catalogoId}
              onChange={agregarDesdeCatalogo}
              items={catalogoItems}
              disabled={productos.length === 0}
              className="min-w-[240px] flex-[1_1_260px]"
            />
            <Button variant="secondary" type="button" onClick={() => setProductoOpen(true)}>
              <PackagePlus size={15} />
              Nuevo producto
            </Button>
            <Button variant="secondary" type="button" onClick={agregarManual}>
              <Plus size={15} />
              Ítem manual
            </Button>
          </div>

          {draftItems.length === 0 ? (
            <EmptyState
              title="Sin ítems"
              description="Agregá un producto del catálogo, creá uno nuevo o cargá un ítem manual."
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-[minmax(160px,2.4fr)_80px_70px_110px_100px_34px] items-center gap-2 px-0.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted max-[820px]:hidden">
                <span>Descripción</span>
                <span>Cant.</span>
                <span>Unidad</span>
                <span>Precio unit.</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>
              <AnimatePresence initial={false}>
                {draftItems.map((item) => (
                  <motion.div
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={quickTransition}
                    className="grid grid-cols-[minmax(160px,2.4fr)_80px_70px_110px_100px_34px] items-center gap-2 max-[820px]:grid-cols-2 max-[820px]:rounded-[10px] max-[820px]:border max-[820px]:border-line max-[820px]:p-2.5"
                  >
                    <input
                      className={cx(inputClass, 'max-[820px]:col-span-full')}
                      value={item.descripcion}
                      onChange={(event) =>
                        actualizarItem(item.id, { descripcion: event.target.value })
                      }
                      placeholder="Producto o detalle"
                      aria-label="Descripción del ítem"
                    />
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="any"
                      value={item.cantidad}
                      onChange={(event) =>
                        actualizarItem(item.id, {
                          cantidad: Number(event.target.value) || 0,
                        })
                      }
                      aria-label="Cantidad"
                    />
                    <input
                      className={inputClass}
                      value={item.unidad ?? ''}
                      onChange={(event) => actualizarItem(item.id, { unidad: event.target.value })}
                      placeholder="u."
                      aria-label="Unidad"
                    />
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.precioUnitario}
                      onChange={(event) =>
                        actualizarItem(item.id, {
                          precioUnitario: Number(event.target.value) || 0,
                        })
                      }
                      aria-label="Precio unitario"
                    />
                    <span className="text-right text-[12.5px] font-semibold max-[820px]:col-span-1 max-[820px]:text-left">
                      {formatMoney(itemSubtotal(item), settings)}
                    </span>
                    <IconButton
                      className="max-[820px]:justify-self-end"
                      label="Quitar ítem"
                      onClick={() => quitarItem(item.id)}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="flex items-baseline justify-end gap-4 border-t border-line pt-3 text-[13px]">
                <span>Total estimado</span>
                <strong className="text-lg">{formatMoney(total, settings)}</strong>
              </div>
            </div>
          )}
        </section>
      </div>

      {editOpen ? (
        <PedidoDialog open onOpenChange={setEditOpen} proveedores={proveedores} pedido={pedido} />
      ) : null}

      {exportOpen && proveedor ? (
        <PedidoExport
          open
          onOpenChange={setExportOpen}
          pedido={pedido}
          proveedor={proveedor}
          items={itemsValidos}
          settings={settings}
        />
      ) : null}

      {productoOpen ? (
        <ProductoDialog
          open
          onOpenChange={setProductoOpen}
          proveedorId={pedido.proveedorId}
          onCreated={agregarProductoCreado}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar pedido"
        description="Se va a eliminar el pedido y sus ítems. Esta acción no se puede deshacer."
        onConfirm={confirmarBorrado}
      />
    </div>
  )
}
