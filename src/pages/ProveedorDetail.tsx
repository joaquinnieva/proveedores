import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  AtSign,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ContactoDialog } from '../components/ContactoDialog'
import { PedidoDialog } from '../components/PedidoDialog'
import { ProductoDialog } from '../components/ProductoDialog'
import { ProveedorDialog } from '../components/ProveedorDialog'
import {
  backLinkClass,
  buttonClass,
  buttonPrimaryClass,
  cardClass,
  cardHeaderClass,
  cardTitleClass,
  chipsClass,
  detailGridClass,
  detailWideClass,
  iconButtonSmClass,
  infoLabelClass,
  infoListClass,
  infoRowClass,
  infoValueClass,
  linkClass,
  listClass,
  listMainClass,
  listNoteClass,
  listRowClass,
  listSubtitleClass,
  listTitleClass,
  loadingClass,
  noteClass,
  pageClass,
  quickActionsClass,
  rowActionsClass,
  rowBadgesClass,
  tableClass,
  tableWrapClass,
  tagClass,
  tdClass,
  thClass,
} from '../components/styles'
import { Badge, Button, ConfirmDialog, EmptyState, IconButton, PageHeader } from '../components/ui'
import { db, useAppSettings } from '../db/db'
import { deleteContacto, deleteProducto, deleteProveedor, registrarContacto } from '../db/repo'
import { cx } from '../lib/cx'
import {
  ESTADO_PEDIDO_LABEL,
  ESTADO_PEDIDO_TONE,
  ESTADO_PROVEEDOR_LABEL,
  formatDate,
  formatMoney,
  isPastDate,
} from '../lib/format'
import { fadeUp, quickTransition, staggerContainer } from '../lib/motion'
import { itemSubtotal, normalizePhone } from '../lib/pedido'
import { calcularPrecioVenta } from '../lib/precios'
import type { Contacto, Pedido, PedidoItem, Producto } from '../types'

const EMPTY_CONTACTOS: Contacto[] = []
const EMPTY_PRODUCTOS: Producto[] = []
const EMPTY_PEDIDOS: Pedido[] = []
const EMPTY_ITEMS: PedidoItem[] = []

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={infoRowClass}>
      <span className={infoLabelClass}>{label}</span>
      <span className={infoValueClass}>{children}</span>
    </div>
  )
}

function instagramUrl(value?: string): string | undefined {
  const cleaned = value?.trim()
  if (!cleaned) return undefined
  if (/^https?:\/\//i.test(cleaned)) return cleaned
  return `https://instagram.com/${cleaned.replace(/^@/, '')}`
}

function webUrl(value?: string): string | undefined {
  const cleaned = value?.trim()
  if (!cleaned) return undefined
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
}

export function ProveedorDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const settings = useAppSettings()

  const loaded = useLiveQuery(async () => {
    if (!id) return { proveedor: null }
    return { proveedor: (await db.proveedores.get(id)) ?? null }
  }, [id])

  const contactos = useLiveQuery(
    () => (id ? db.contactos.where('proveedorId').equals(id).toArray() : []),
    [id],
    EMPTY_CONTACTOS,
  )
  const productos = useLiveQuery(
    () => (id ? db.productos.where('proveedorId').equals(id).toArray() : []),
    [id],
    EMPTY_PRODUCTOS,
  )
  const pedidos = useLiveQuery(
    () => (id ? db.pedidos.where('proveedorId').equals(id).toArray() : []),
    [id],
    EMPTY_PEDIDOS,
  )
  const items = useLiveQuery(() => db.items.toArray(), [], EMPTY_ITEMS)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pedidoOpen, setPedidoOpen] = useState(false)
  const [contactoOpen, setContactoOpen] = useState(false)
  const [contactoEdit, setContactoEdit] = useState<Contacto | null>(null)
  const [borrarContacto, setBorrarContacto] = useState<Contacto | null>(null)
  const [productoOpen, setProductoOpen] = useState(false)
  const [productoEdit, setProductoEdit] = useState<Producto | null>(null)
  const [borrarProducto, setBorrarProducto] = useState<Producto | null>(null)

  const itemsPorPedido = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      map.set(item.pedidoId, (map.get(item.pedidoId) ?? 0) + 1)
    }
    return map
  }, [items])

  const totalPorPedido = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      map.set(item.pedidoId, (map.get(item.pedidoId) ?? 0) + itemSubtotal(item))
    }
    return map
  }, [items])

  if (!loaded) {
    return <p className={loadingClass}>Cargando proveedor…</p>
  }

  const proveedor = loaded.proveedor
  if (!proveedor) {
    return (
      <div className={pageClass}>
        <EmptyState
          title="Proveedor no encontrado"
          description="Puede que lo hayas eliminado o que el enlace esté mal."
          action={
            <Link className={buttonPrimaryClass} to="/proveedores">
              Ver proveedores
            </Link>
          }
        />
      </div>
    )
  }

  const whatsapp = normalizePhone(proveedor.whatsapp ?? proveedor.telefono)
  const instagram = instagramUrl(proveedor.instagram)
  const web = webUrl(proveedor.web)
  const productosOrdenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const pedidosOrdenados = [...pedidos].sort((a, b) => b.fecha.localeCompare(a.fecha))

  function contacto() {
    if (proveedor) void registrarContacto(proveedor.id)
  }

  async function confirmarBorradoProveedor() {
    if (!proveedor) return
    await deleteProveedor(proveedor.id)
    navigate('/proveedores')
  }

  return (
    <div className={pageClass}>
      <Link className={backLinkClass} to="/proveedores">
        <ArrowLeft size={15} />
        Proveedores
      </Link>

      <PageHeader
        title={proveedor.nombre}
        subtitle={[proveedor.rubro, proveedor.zona].filter(Boolean).join(' · ') || 'Proveedor'}
        actions={
          <>
            <Button variant="primary" onClick={() => setPedidoOpen(true)} type="button">
              <Plus size={16} />
              Nuevo pedido
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(true)} type="button">
              <Pencil size={16} />
              Editar
            </Button>
            <IconButton label="Eliminar proveedor" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
            </IconButton>
          </>
        }
      />

      <div className={detailGridClass}>
        <section className={`${cardClass} p-5`}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Datos</h2>
            <Badge tone={proveedor.estado === 'activo' ? 'success' : 'neutral'}>
              {ESTADO_PROVEEDOR_LABEL[proveedor.estado]}
            </Badge>
          </div>
          <div className={infoListClass}>
            {proveedor.whatsapp ? (
              <InfoRow label="WhatsApp">
                <a
                  className={linkClass}
                  href={`https://wa.me/${normalizePhone(proveedor.whatsapp)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={contacto}
                >
                  {proveedor.whatsapp}
                </a>
              </InfoRow>
            ) : null}
            {proveedor.telefono ? (
              <InfoRow label="Teléfono">
                <a className={linkClass} href={`tel:${proveedor.telefono}`} onClick={contacto}>
                  {proveedor.telefono}
                </a>
              </InfoRow>
            ) : null}
            {proveedor.email ? (
              <InfoRow label="Email">
                <a className={linkClass} href={`mailto:${proveedor.email}`} onClick={contacto}>
                  {proveedor.email}
                </a>
              </InfoRow>
            ) : null}
            {web ? (
              <InfoRow label="Web">
                <a className={linkClass} href={web} target="_blank" rel="noreferrer">
                  {proveedor.web}
                </a>
              </InfoRow>
            ) : null}
            {instagram ? (
              <InfoRow label="Instagram">
                <a className={linkClass} href={instagram} target="_blank" rel="noreferrer">
                  {proveedor.instagram}
                </a>
              </InfoRow>
            ) : null}
            {proveedor.direccion ? (
              <InfoRow label="Dirección">{proveedor.direccion}</InfoRow>
            ) : null}
            {proveedor.condicionesPago ? (
              <InfoRow label="Pago">{proveedor.condicionesPago}</InfoRow>
            ) : null}
            {typeof proveedor.pedidoMinimo === 'number' ? (
              <InfoRow label="Pedido mínimo">
                {formatMoney(proveedor.pedidoMinimo, settings)}
              </InfoRow>
            ) : null}
            {typeof proveedor.costoEnvio === 'number' ? (
              <InfoRow label="Envío">
                {proveedor.costoEnvio > 0
                  ? `${formatMoney(proveedor.costoEnvio, settings)}${
                      typeof proveedor.envioGratisDesde === 'number'
                        ? ` · gratis desde ${formatMoney(proveedor.envioGratisDesde, settings)}`
                        : ''
                    }`
                  : 'Gratis'}
              </InfoRow>
            ) : null}
            {proveedor.plazoEntrega ? (
              <InfoRow label="Entrega">{proveedor.plazoEntrega}</InfoRow>
            ) : null}
            <InfoRow label="Último contacto">
              {proveedor.ultimoContacto ? formatDate(proveedor.ultimoContacto) : '—'}
            </InfoRow>
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

          {proveedor.notas ? <p className={noteClass}>{proveedor.notas}</p> : null}

          <div className={quickActionsClass}>
            {whatsapp ? (
              <a
                className={buttonClass('secondary', 'sm')}
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                onClick={contacto}
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            ) : null}
            {proveedor.email ? (
              <a
                className={buttonClass('secondary', 'sm')}
                href={`mailto:${proveedor.email}`}
                onClick={contacto}
              >
                <Mail size={15} />
                Email
              </a>
            ) : null}
            {proveedor.telefono ? (
              <a
                className={buttonClass('secondary', 'sm')}
                href={`tel:${proveedor.telefono}`}
                onClick={contacto}
              >
                <Phone size={15} />
                Llamar
              </a>
            ) : null}
            {web ? (
              <a
                className={buttonClass('secondary', 'sm')}
                href={web}
                target="_blank"
                rel="noreferrer"
              >
                <Globe size={15} />
                Web
              </a>
            ) : null}
            {instagram ? (
              <a
                className={buttonClass('secondary', 'sm')}
                href={instagram}
                target="_blank"
                rel="noreferrer"
              >
                <AtSign size={15} />
                Instagram
              </a>
            ) : null}
          </div>
        </section>

        <section className={`${cardClass} p-5`}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Contactos</h2>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setContactoEdit(null)
                setContactoOpen(true)
              }}
            >
              <Plus size={15} />
              Agregar
            </Button>
          </div>
          {contactos.length === 0 ? (
            <EmptyState
              title="Sin contactos"
              description="Agregá personas de contacto del proveedor."
            />
          ) : (
            <motion.ul
              className={listClass}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {contactos.map((item) => (
                <motion.li
                  className={listRowClass}
                  key={item.id}
                  variants={fadeUp}
                  transition={quickTransition}
                >
                  <div className={listMainClass}>
                    <span className={listTitleClass}>{item.nombre}</span>
                    <span className={listSubtitleClass}>
                      {[item.rol, item.telefono, item.email].filter(Boolean).join(' · ') || '—'}
                    </span>
                    {item.notas ? <span className={listNoteClass}>{item.notas}</span> : null}
                  </div>
                  <div className={rowActionsClass}>
                    <IconButton
                      size="sm"
                      label="Editar contacto"
                      onClick={() => {
                        setContactoEdit(item)
                        setContactoOpen(true)
                      }}
                    >
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton
                      size="sm"
                      label="Eliminar contacto"
                      onClick={() => setBorrarContacto(item)}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>

        <section className={cx(cardClass, detailWideClass, 'p-5')}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Catálogo</h2>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setProductoEdit(null)
                setProductoOpen(true)
              }}
            >
              <Plus size={15} />
              Agregar producto
            </Button>
          </div>
          {productosOrdenados.length === 0 ? (
            <EmptyState
              title="Sin productos cargados"
              description="Guardá los artículos que pedís habitualmente para reutilizarlos."
            />
          ) : (
            <div className={tableWrapClass}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={cx(thClass, 'text-left')}>Producto</th>
                    <th className={cx(thClass, 'text-left')}>Categoría</th>
                    <th className={cx(thClass, 'text-right')}>Costo</th>
                    <th className={cx(thClass, 'text-right')}>Mínimo</th>
                    <th className={thClass} aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {productosOrdenados.map((producto) => {
                    const calculo =
                      typeof producto.costo === 'number'
                        ? calcularPrecioVenta(producto.costo, settings.margenGanancia)
                        : undefined
                    return (
                      <tr key={producto.id}>
                        <td className={tdClass}>
                          <span className="block font-semibold">{producto.nombre}</span>
                          {producto.codigo ? (
                            <span className="block text-[11.5px] text-muted">
                              Cód. {producto.codigo}
                            </span>
                          ) : null}
                        </td>
                        <td className={tdClass}>{producto.categoria ?? '—'}</td>
                        <td className={cx(tdClass, 'text-right')}>
                          {typeof producto.costo === 'number' ? (
                            <>
                              {formatMoney(producto.costo, settings)}
                              {calculo ? (
                                <span className="block text-[11.5px] text-muted">
                                  Venta {formatMoney(calculo.venta, settings)}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={cx(tdClass, 'text-right')}>
                          {typeof producto.moq === 'number'
                            ? `${producto.moq}${producto.unidad ? ` ${producto.unidad}` : ''}`
                            : '—'}
                        </td>
                        <td className={tdClass}>
                          <div className={rowActionsClass}>
                            {producto.link ? (
                              <a
                                className={iconButtonSmClass}
                                href={producto.link}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Abrir link del producto"
                              >
                                <ExternalLink size={15} />
                              </a>
                            ) : null}
                            <IconButton
                              size="sm"
                              label="Editar producto"
                              onClick={() => {
                                setProductoEdit(producto)
                                setProductoOpen(true)
                              }}
                            >
                              <Pencil size={15} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              label="Eliminar producto"
                              onClick={() => setBorrarProducto(producto)}
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className={cx(cardClass, detailWideClass, 'p-5')}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Pedidos</h2>
            <Button variant="ghost" size="sm" type="button" onClick={() => setPedidoOpen(true)}>
              <Plus size={15} />
              Nuevo pedido
            </Button>
          </div>
          {pedidosOrdenados.length === 0 ? (
            <EmptyState
              title="Sin pedidos"
              description="Creá un pedido para este proveedor y guardalo para después."
            />
          ) : (
            <motion.ul
              className={listClass}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {pedidosOrdenados.map((pedido) => (
                <motion.li key={pedido.id} variants={fadeUp} transition={quickTransition}>
                  <Link className={listRowClass} to={`/pedidos/${pedido.id}`}>
                    <div className={listMainClass}>
                      <span className={listTitleClass}>
                        {pedido.referencia || 'Pedido sin referencia'}
                      </span>
                      <span className={listSubtitleClass}>
                        {formatDate(pedido.fecha)} · {itemsPorPedido.get(pedido.id) ?? 0} ítems ·{' '}
                        {formatMoney(totalPorPedido.get(pedido.id) ?? 0, settings)}
                        {pedido.fechaDeseada ? ` · para ${formatDate(pedido.fechaDeseada)}` : ''}
                      </span>
                    </div>
                    <div className={rowBadgesClass}>
                      {pedido.fechaDeseada &&
                      isPastDate(pedido.fechaDeseada) &&
                      pedido.estado !== 'recibido' &&
                      pedido.estado !== 'cancelado' ? (
                        <Badge tone="danger">Vencido</Badge>
                      ) : null}
                      <Badge tone={ESTADO_PEDIDO_TONE[pedido.estado]}>
                        {ESTADO_PEDIDO_LABEL[pedido.estado]}
                      </Badge>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>
      </div>

      {editOpen ? <ProveedorDialog open onOpenChange={setEditOpen} proveedor={proveedor} /> : null}

      {pedidoOpen ? (
        <PedidoDialog
          open
          onOpenChange={setPedidoOpen}
          proveedores={[proveedor]}
          defaultProveedorId={proveedor.id}
        />
      ) : null}

      {contactoOpen ? (
        <ContactoDialog
          open
          onOpenChange={setContactoOpen}
          proveedorId={proveedor.id}
          contacto={contactoEdit}
        />
      ) : null}

      {productoOpen ? (
        <ProductoDialog
          open
          onOpenChange={setProductoOpen}
          proveedorId={proveedor.id}
          producto={productoEdit}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar proveedor"
        description={`Se va a eliminar "${proveedor.nombre}" junto con sus contactos, productos y pedidos.`}
        onConfirm={confirmarBorradoProveedor}
      />

      <ConfirmDialog
        open={borrarContacto !== null}
        onOpenChange={(open) => {
          if (!open) setBorrarContacto(null)
        }}
        title="Eliminar contacto"
        description={
          borrarContacto ? `Se va a eliminar el contacto "${borrarContacto.nombre}".` : undefined
        }
        onConfirm={async () => {
          if (borrarContacto) await deleteContacto(borrarContacto.id)
          setBorrarContacto(null)
        }}
      />

      <ConfirmDialog
        open={borrarProducto !== null}
        onOpenChange={(open) => {
          if (!open) setBorrarProducto(null)
        }}
        title="Eliminar producto"
        description={
          borrarProducto
            ? `Se va a eliminar "${borrarProducto.nombre}" del catálogo. Los pedidos ya guardados no cambian.`
            : undefined
        }
        onConfirm={async () => {
          if (borrarProducto) await deleteProducto(borrarProducto.id)
          setBorrarProducto(null)
        }}
      />
    </div>
  )
}
