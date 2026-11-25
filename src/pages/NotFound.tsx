import { Link } from 'react-router'
import { buttonPrimaryClass, pageClass } from '../components/styles'
import { EmptyState } from '../components/ui'

export function NotFound() {
  return (
    <div className={pageClass}>
      <EmptyState
        title="Página no encontrada"
        description="La dirección no existe o el contenido se movió."
        action={
          <Link className={buttonPrimaryClass} to="/">
            Ir al panel
          </Link>
        }
      />
    </div>
  )
}
