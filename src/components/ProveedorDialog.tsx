import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { saveProveedor } from '../db/repo'
import { parseNumber, parseTags } from '../lib/format'
import type { EstadoProveedor, Proveedor } from '../types'
import { ESTADOS_PROVEEDOR } from '../types'
import {
  buttonSecondaryClass,
  dialogActionsClass,
  dialogBackdropClass,
  dialogDescriptionClass,
  dialogFormClass,
  dialogHeaderClass,
  dialogPopupClass,
  dialogTitleClass,
  formGridClass,
  formWideClass,
  iconButtonClass,
} from './styles'
import { Button, SelectField, TextAreaField, TextField } from './ui'

export function ProveedorDialog({
  open,
  onOpenChange,
  proveedor,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proveedor?: Proveedor | null
}) {
  const [nombre, setNombre] = useState(proveedor?.nombre ?? '')
  const [rubro, setRubro] = useState(proveedor?.rubro ?? '')
  const [etiquetas, setEtiquetas] = useState((proveedor?.etiquetas ?? []).join(', '))
  const [estado, setEstado] = useState<EstadoProveedor>(proveedor?.estado ?? 'activo')
  const [whatsapp, setWhatsapp] = useState(proveedor?.whatsapp ?? '')
  const [email, setEmail] = useState(proveedor?.email ?? '')
  const [telefono, setTelefono] = useState(proveedor?.telefono ?? '')
  const [web, setWeb] = useState(proveedor?.web ?? '')
  const [instagram, setInstagram] = useState(proveedor?.instagram ?? '')
  const [direccion, setDireccion] = useState(proveedor?.direccion ?? '')
  const [zona, setZona] = useState(proveedor?.zona ?? '')
  const [condicionesPago, setCondicionesPago] = useState(proveedor?.condicionesPago ?? '')
  const [pedidoMinimo, setPedidoMinimo] = useState(
    typeof proveedor?.pedidoMinimo === 'number' ? String(proveedor.pedidoMinimo) : '',
  )
  const [plazoEntrega, setPlazoEntrega] = useState(proveedor?.plazoEntrega ?? '')
  const [ultimoContacto, setUltimoContacto] = useState(proveedor?.ultimoContacto ?? '')
  const [notas, setNotas] = useState(proveedor?.notas ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nombre.trim()) {
      setError('Poné un nombre para el proveedor.')
      return
    }
    setBusy(true)
    try {
      await saveProveedor(
        {
          nombre: nombre.trim(),
          rubro: rubro.trim() || undefined,
          etiquetas: parseTags(etiquetas),
          estado,
          whatsapp: whatsapp.trim() || undefined,
          email: email.trim() || undefined,
          telefono: telefono.trim() || undefined,
          web: web.trim() || undefined,
          instagram: instagram.trim() || undefined,
          direccion: direccion.trim() || undefined,
          zona: zona.trim() || undefined,
          condicionesPago: condicionesPago.trim() || undefined,
          pedidoMinimo: parseNumber(pedidoMinimo),
          plazoEntrega: plazoEntrega.trim() || undefined,
          notas: notas.trim() || undefined,
          ultimoContacto: ultimoContacto || undefined,
        },
        proveedor?.id,
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
        <Dialog.Popup className={dialogPopupClass}>
          <div className={dialogHeaderClass}>
            <div>
              <Dialog.Title className={dialogTitleClass}>
                {proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
              </Dialog.Title>
              <p className={dialogDescriptionClass}>
                Cargá los datos que uses para contactarlo y hacer pedidos.
              </p>
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
                placeholder="Ej. Distribuidora Norte"
                error={error || undefined}
                autoFocus
              />
              <TextField
                label="Rubro"
                value={rubro}
                onChange={setRubro}
                placeholder="Ej. Textiles"
              />
              <SelectField
                label="Estado"
                value={estado}
                onChange={(value) => setEstado(value as EstadoProveedor)}
                items={ESTADOS_PROVEEDOR.map((item) => ({
                  value: item,
                  label: item === 'activo' ? 'Activo' : 'Pausado',
                }))}
              />
              <TextField
                label="Etiquetas"
                value={etiquetas}
                onChange={setEtiquetas}
                placeholder="mayorista, lanas, confiable"
                hint="Separá con comas."
              />
              <TextField
                label="WhatsApp"
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="+54 9 11 5555 5555"
                inputMode="tel"
              />
              <TextField
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="ventas@proveedor.com"
                type="email"
              />
              <TextField
                label="Teléfono"
                value={telefono}
                onChange={setTelefono}
                placeholder="+54 11 4444 4444"
                inputMode="tel"
              />
              <TextField
                label="Instagram"
                value={instagram}
                onChange={setInstagram}
                placeholder="@usuario o link"
              />
              <TextField
                label="Web"
                value={web}
                onChange={setWeb}
                placeholder="https://…"
                type="url"
              />
              <TextField
                label="Zona"
                value={zona}
                onChange={setZona}
                placeholder="Ej. Villa Crespo / envíos nacionales"
              />
              <TextField
                label="Dirección"
                value={direccion}
                onChange={setDireccion}
                placeholder="Calle, número, localidad"
              />
              <TextField
                label="Condiciones de pago"
                value={condicionesPago}
                onChange={setCondicionesPago}
                placeholder="Ej. 30 días, transferencia"
              />
              <TextField
                label="Pedido mínimo"
                value={pedidoMinimo}
                onChange={setPedidoMinimo}
                placeholder="0"
                inputMode="decimal"
              />
              <TextField
                label="Plazo de entrega"
                value={plazoEntrega}
                onChange={setPlazoEntrega}
                placeholder="Ej. 7 días"
              />
              <TextField
                label="Último contacto"
                value={ultimoContacto}
                onChange={setUltimoContacto}
                type="date"
              />
              <TextAreaField
                label="Notas"
                value={notas}
                onChange={setNotas}
                placeholder="Horarios, personas de contacto, observaciones…"
                rows={3}
                className={formWideClass}
              />
            </div>
            <div className={dialogActionsClass}>
              <Dialog.Close className={buttonSecondaryClass} type="button">
                Cancelar
              </Dialog.Close>
              <Button type="submit" variant="primary" disabled={busy}>
                {proveedor ? 'Guardar cambios' : 'Crear proveedor'}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
