import { useLiveQuery } from 'dexie-react-hooks'
import { CircleDollarSign, ClipboardList, Clock3, Plus, Store } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import {
  buttonPrimaryClass,
  cardClass,
  cardHeaderClass,
  cardTitleClass,
  chipClass,
  chipsClass,
  linkClass,
  listClass,
  listMainClass,
  listRowClass,
  listSubtitleClass,
  listTitleClass,
  pageClass,
} from '../components/styles'
import { Badge, EmptyState, PageHeader } from '../components/ui'
import { db, useAppSettings } from '../db/db'
import {
  ESTADO_PEDIDO_LABEL,
  ESTADO_PEDIDO_TONE,
  formatDate,
  formatMoney,
  isPastDate,
} from '../lib/format'
import { fadeIn, fadeUp, quickTransition, staggerContainer } from '../lib/motion'
import { itemSubtotal } from '../lib/pedido'
import type { EstadoPedido, Pedido, PedidoItem, Proveedor } from '../types'

const ESTADOS_ABIERTOS: EstadoPedido[] = ['interesado', 'por_pedir', 'pedido', 'confirmado']
const EMPTY_PROVEEDORES: Proveedor[] = []
const EMPTY_PEDIDOS: Pedido[] = []
const EMPTY_ITEMS: PedidoItem[] = []

function esAbierto(estado: EstadoPedido): boolean {
  return ESTADOS_ABIERTOS.includes(estado)
}

export function Dashboard() {
  const settings = useAppSettings()
  const proveedores = useLiveQuery(() => db.proveedores.toArray(), [], EMPTY_PROVEEDORES)
  const pedidos = useLiveQuery(() => db.pedidos.toArray(), [], EMPTY_PEDIDOS)
  const items = useLiveQuery(() => db.items.toArray(), [], EMPTY_ITEMS)

  const proveedoresPorId = new Map(proveedores.map((item) => [item.id, item]))
  const abiertos = pedidos.filter((pedido) => esAbierto(pedido.estado))
  const interesados = pedidos.filter((pedido) => pedido.estado === 'interesado')
  const activos = proveedores.filter((item) => item.estado === 'activo')

  const idsAbiertos = new Set(abiertos.map((pedido) => pedido.id))
  const valorAbierto = items
    .filter((item) => idsAbiertos.has(item.pedidoId))
    .reduce((total, item) => total + itemSubtotal(item), 0)

  const atencion = abiertos
    .filter((pedido) => pedido.fechaDeseada && isPastDate(pedido.fechaDeseada))
    .sort((a, b) => (a.fechaDeseada ?? '').localeCompare(b.fechaDeseada ?? ''))
    .slice(0, 5)

  const recientes = [...pedidos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  const stats = [
    {
      label: 'Proveedores activos',
      value: String(activos.length),
      hint: `${proveedores.length} en total`,
      icon: Store,
    },
    {
      label: 'Pedidos abiertos',
      value: String(abiertos.length),
      hint: `${pedidos.length} en total`,
      icon: ClipboardList,
    },
    {
      label: 'Interesados',
      value: String(interesados.length),
      hint: 'Para revisar y pedir',
      icon: Clock3,
    },
    {
      label: 'Valor en pedidos abiertos',
      value: formatMoney(valorAbierto, settings),
      hint: 'Según precios cargados',
      icon: CircleDollarSign,
    },
  ]

  return (
    <div className={pageClass}>
      <PageHeader
        title="Panel"
        subtitle="Resumen de tus proveedores y pedidos."
        actions={
          <Link className={buttonPrimaryClass} to="/pedidos?nuevo=1">
            <Plus size={16} />
            Nuevo pedido
          </Link>
        }
      />

      <motion.section
        className="grid grid-cols-1 gap-3.5 min-[480px]:grid-cols-2 min-[1100px]:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.article
              variants={fadeUp}
              transition={quickTransition}
              className={`${cardClass} flex items-start gap-3.5 p-[18px]`}
              key={stat.label}
            >
              <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-accent-soft text-accent-ink">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="mt-0.5 text-[22px] font-[750] tracking-[-0.02em] [overflow-wrap:anywhere]">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[11.5px] text-muted">{stat.hint}</p>
              </div>
            </motion.article>
          )
        })}
      </motion.section>

      <div className="grid grid-cols-1 gap-5 min-[900px]:grid-cols-2">
        <section className={`${cardClass} p-5`}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Requieren atención</h2>
            <Link className={linkClass} to="/pedidos">
              Ver pedidos
            </Link>
          </div>
          {atencion.length === 0 ? (
            <EmptyState
              title="Nada vencido"
              description="No hay pedidos abiertos con fecha deseada pasada."
            />
          ) : (
            <motion.ul
              className={listClass}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {atencion.map((pedido) => (
                <motion.li key={pedido.id} variants={fadeUp} transition={quickTransition}>
                  <Link className={listRowClass} to={`/pedidos/${pedido.id}`}>
                    <div className={listMainClass}>
                      <span className={listTitleClass}>
                        {pedido.referencia ||
                          proveedoresPorId.get(pedido.proveedorId)?.nombre ||
                          'Pedido'}
                      </span>
                      <span className={listSubtitleClass}>
                        {proveedoresPorId.get(pedido.proveedorId)?.nombre ?? 'Proveedor'} · para{' '}
                        {formatDate(pedido.fechaDeseada)}
                      </span>
                    </div>
                    <Badge tone={ESTADO_PEDIDO_TONE[pedido.estado]}>
                      {ESTADO_PEDIDO_LABEL[pedido.estado]}
                    </Badge>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>

        <section className={`${cardClass} p-5`}>
          <div className={cardHeaderClass}>
            <h2 className={cardTitleClass}>Pedidos recientes</h2>
            <Link className={linkClass} to="/pedidos">
              Ver todos
            </Link>
          </div>
          {recientes.length === 0 ? (
            <EmptyState
              title="Todavía no hay pedidos"
              description="Creá un pedido y guardalo para retomarlo cuando quieras."
              action={
                <Link className={buttonPrimaryClass} to="/pedidos?nuevo=1">
                  <Plus size={16} />
                  Nuevo pedido
                </Link>
              }
            />
          ) : (
            <motion.ul
              className={listClass}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {recientes.map((pedido) => (
                <motion.li key={pedido.id} variants={fadeUp} transition={quickTransition}>
                  <Link className={listRowClass} to={`/pedidos/${pedido.id}`}>
                    <div className={listMainClass}>
                      <span className={listTitleClass}>
                        {pedido.referencia || 'Pedido sin referencia'}
                      </span>
                      <span className={listSubtitleClass}>
                        {proveedoresPorId.get(pedido.proveedorId)?.nombre ?? 'Proveedor'} ·{' '}
                        {formatDate(pedido.fecha)}
                      </span>
                    </div>
                    <Badge tone={ESTADO_PEDIDO_TONE[pedido.estado]}>
                      {ESTADO_PEDIDO_LABEL[pedido.estado]}
                    </Badge>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </section>
      </div>

      <section className={`${cardClass} p-5`}>
        <div className={cardHeaderClass}>
          <h2 className={cardTitleClass}>Tus proveedores</h2>
          <Link className={linkClass} to="/proveedores">
            Administrar
          </Link>
        </div>
        {proveedores.length === 0 ? (
          <EmptyState
            title="Empezá por cargar un proveedor"
            description="Guardá sus datos de contacto, productos y pedidos."
            action={
              <Link className={buttonPrimaryClass} to="/proveedores?nuevo=1">
                <Plus size={16} />
                Nuevo proveedor
              </Link>
            }
          />
        ) : (
          <motion.div
            className={chipsClass}
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={quickTransition}
          >
            {proveedores.slice(0, 18).map((proveedor) => (
              <Link key={proveedor.id} className={chipClass} to={`/proveedores/${proveedor.id}`}>
                {proveedor.nombre}
                {proveedor.rubro ? <span className="text-muted"> · {proveedor.rubro}</span> : null}
              </Link>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  )
}
