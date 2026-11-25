import { ClipboardList, LayoutDashboard, Settings, Store } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { NavLink, useLocation, useOutlet } from 'react-router'
import { cx } from '../lib/cx'

const navItems = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/proveedores', label: 'Proveedores', icon: Store, end: false },
  { to: '/pedidos', label: 'Pedidos', icon: ClipboardList, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, end: false },
]

export function Layout() {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <div className="grid min-h-screen grid-cols-1 min-[900px]:grid-cols-[258px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-[26px] border-r border-line bg-surface px-[18px] py-[22px] min-[900px]:flex">
        <NavLink to="/" className="flex items-center gap-3 rounded-xl px-1.5 py-1" end>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-lg font-extrabold text-white">
            P
          </span>
          <span className="flex flex-col leading-[1.15]">
            <strong className="text-[15px]">Proveedores</strong>
            <small className="text-[11px] text-muted">Pedidos y contactos</small>
          </span>
        </NavLink>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink',
                    isActive && 'bg-accent-soft text-accent-ink',
                  )
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <p className="mt-auto px-1.5 text-[11px] leading-normal text-muted">
          Tus datos quedan en este dispositivo. Hacé un backup desde Ajustes.
        </p>
      </aside>
      <main className="min-w-0 px-4 pb-24 pt-5 min-[900px]:px-10 min-[900px]:pb-20 min-[900px]:pt-[34px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 gap-0.5 border-t border-line bg-surface px-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 min-[900px]:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(
                  'flex flex-col items-center gap-[3px] rounded-[10px] py-1.5 text-[10px] text-muted',
                  isActive && 'bg-accent-soft text-accent-ink',
                )
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
