import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { saveContacto } from '../db/repo'
import { cx } from '../lib/cx'
import type { Contacto } from '../types'
import {
  buttonSecondaryClass,
  dialogActionsClass,
  dialogBackdropClass,
  dialogDescriptionClass,
  dialogFormClass,
  dialogHeaderClass,
  dialogPopupClass,
  dialogPopupSmClass,
  dialogTitleClass,
  formGridClass,
  formWideClass,
  iconButtonClass,
} from './styles'
import { Button, TextField } from './ui'

export function ContactoDialog({
  open,
  onOpenChange,
  proveedorId,
  contacto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proveedorId: string
  contacto?: Contacto | null
}) {
  const [nombre, setNombre] = useState(contacto?.nombre ?? '')
  const [rol, setRol] = useState(contacto?.rol ?? '')
  const [telefono, setTelefono] = useState(contacto?.telefono ?? '')
  const [email, setEmail] = useState(contacto?.email ?? '')
  const [notas, setNotas] = useState(contacto?.notas ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nombre.trim()) {
      setError('Poné un nombre para el contacto.')
      return
    }
    setBusy(true)
    try {
      await saveContacto(
        {
          proveedorId,
          nombre: nombre.trim(),
          rol: rol.trim() || undefined,
          telefono: telefono.trim() || undefined,
          email: email.trim() || undefined,
          notas: notas.trim() || undefined,
        },
        contacto?.id,
      )
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogBackdropClass} />
        <Dialog.Popup className={cx(dialogPopupClass, dialogPopupSmClass)}>
          <div className={dialogHeaderClass}>
            <div>
              <Dialog.Title className={dialogTitleClass}>
                {contacto ? 'Editar contacto' : 'Nuevo contacto'}
              </Dialog.Title>
              <p className={dialogDescriptionClass}>Persona de contacto dentro del proveedor.</p>
            </div>
            <Dialog.Close className={iconButtonClass} aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>
          </div>
          <form className={dialogFormClass} onSubmit={handleSubmit}>
            <div className={formGridClass}>
              <TextField
                label="Nombre *"
                value={nombre}
                onChange={setNombre}
                placeholder="Ej. Laura"
                error={error || undefined}
                autoFocus
              />
              <TextField label="Rol" value={rol} onChange={setRol} placeholder="Ej. Ventas" />
              <TextField
                label="Teléfono"
                value={telefono}
                onChange={setTelefono}
                placeholder="+54 9 11 5555 5555"
                inputMode="tel"
              />
              <TextField
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="laura@proveedor.com"
                type="email"
              />
              <TextField
                label="Notas"
                value={notas}
                onChange={setNotas}
                placeholder="Horarios, preferencias…"
                className={formWideClass}
              />
            </div>
            <div className={dialogActionsClass}>
              <Dialog.Close className={buttonSecondaryClass} type="button">
                Cancelar
              </Dialog.Close>
              <Button type="submit" variant="primary" disabled={busy}>
                Guardar
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
