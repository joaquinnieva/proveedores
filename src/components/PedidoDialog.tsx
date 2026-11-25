import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { todayISO } from '../db/db'
import { crearPedido, updatePedido } from '../db/repo'
import { cx } from '../lib/cx'
import { CANAL_LABEL, ESTADO_PEDIDO_LABEL, PRIORIDAD_LABEL } from '../lib/format'
import type { CanalPedido, EstadoPedido, Pedido, PrioridadPedido, Proveedor } from '../types'
import { CANALES, ESTADOS_PEDIDO, PRIORIDADES } from '../types'
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
import { Button, SelectField, TextAreaField, TextField } from './ui'

export function PedidoDialog({
  open,
  onOpenChange,
  proveedores,
  pedido,
  defaultProveedorId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proveedores: Proveedor[]
  pedido?: Pedido | null
  defaultProveedorId?: string
}) {
  const navigate = useNavigate()
  const [proveedorId, setProveedorId] = useState(
    pedido?.proveedorId ?? defaultProveedorId ?? proveedores[0]?.id ?? '',
  )
  const [referencia, setReferencia] = useState(pedido?.referencia ?? '')
  const [estado, setEstado] = useState<EstadoPedido>(pedido?.estado ?? 'interesado')
  const [canal, setCanal] = useState<CanalPedido>(pedido?.canal ?? 'whatsapp')
  const [prioridad, setPrioridad] = useState<PrioridadPedido>(pedido?.prioridad ?? 'media')
  const [fecha, setFecha] = useState(pedido?.fecha ?? todayISO())
  const [fechaDeseada, setFechaDeseada] = useState(pedido?.fechaDeseada ?? '')
  const [notas, setNotas] = useState(pedido?.notas ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!proveedorId) {
      setError('Elegí un proveedor.')
      return
    }
    setBusy(true)
    try {
      const data = {
        proveedorId,
        referencia: referencia.trim() || undefined,
        estado,
        canal,
        prioridad,
        fecha,
        fechaDeseada: fechaDeseada || undefined,
        notas: notas.trim() || undefined,
      }
      if (pedido) {
        await updatePedido({ ...pedido, ...data })
        onOpenChange(false)
      } else {
        const id = await crearPedido(proveedorId, data)
        onOpenChange(false)
        navigate(`/pedidos/${id}`)
      }
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
                {pedido ? 'Editar pedido' : 'Nuevo pedido'}
              </Dialog.Title>
              <p className={dialogDescriptionClass}>
                Después podés agregar los productos y generar el mensaje.
              </p>
            </div>
            <Dialog.Close className={iconButtonClass} aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>
          </div>
          {proveedores.length === 0 ? (
            <div className={dialogFormClass}>
              <p className="max-w-[46ch] text-[13px] text-muted">
                Primero cargá un proveedor para poder crear pedidos.
              </p>
              <div className={dialogActionsClass}>
                <Dialog.Close className={buttonSecondaryClass} type="button">
                  Cerrar
                </Dialog.Close>
              </div>
            </div>
          ) : (
            <form className={dialogFormClass} onSubmit={handleSubmit}>
              <div className={formGridClass}>
                <SelectField
                  label="Proveedor *"
                  value={proveedorId}
                  onChange={setProveedorId}
                  items={proveedores.map((item) => ({
                    value: item.id,
                    label: item.nombre,
                  }))}
                  error={error || undefined}
                  className={formWideClass}
                />
                <TextField
                  label="Referencia"
                  value={referencia}
                  onChange={setReferencia}
                  placeholder="Ej. Reposición otoño"
                />
                <SelectField
                  label="Estado"
                  value={estado}
                  onChange={(value) => setEstado(value as EstadoPedido)}
                  items={ESTADOS_PEDIDO.map((item) => ({
                    value: item,
                    label: ESTADO_PEDIDO_LABEL[item],
                  }))}
                />
                <SelectField
                  label="Canal"
                  value={canal}
                  onChange={(value) => setCanal(value as CanalPedido)}
                  items={CANALES.map((item) => ({
                    value: item,
                    label: CANAL_LABEL[item],
                  }))}
                />
                <SelectField
                  label="Prioridad"
                  value={prioridad}
                  onChange={(value) => setPrioridad(value as PrioridadPedido)}
                  items={PRIORIDADES.map((item) => ({
                    value: item,
                    label: PRIORIDAD_LABEL[item],
                  }))}
                />
                <TextField label="Fecha" value={fecha} onChange={setFecha} type="date" />
                <TextField
                  label="Fecha deseada"
                  value={fechaDeseada}
                  onChange={setFechaDeseada}
                  type="date"
                />
                <TextAreaField
                  label="Notas"
                  value={notas}
                  onChange={setNotas}
                  placeholder="Condiciones, aclaraciones…"
                  rows={2}
                  className={formWideClass}
                />
              </div>
              <div className={dialogActionsClass}>
                <Dialog.Close className={buttonSecondaryClass} type="button">
                  Cancelar
                </Dialog.Close>
                <Button type="submit" variant="primary" disabled={busy}>
                  {pedido ? 'Guardar cambios' : 'Crear pedido'}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
