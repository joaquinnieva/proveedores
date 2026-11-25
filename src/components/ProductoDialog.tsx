import { Dialog } from '@base-ui/react/dialog'
import { Image as ImageIcon, Trash2, Upload, X } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { db, useAppSettings } from '../db/db'
import { saveProducto } from '../db/repo'
import { cx } from '../lib/cx'
import { formatMoney, parseNumber } from '../lib/format'
import { prepararImagen } from '../lib/imagen'
import { calcularPrecioVenta } from '../lib/precios'
import type { Producto } from '../types'
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
import { Button, TextAreaField, TextField } from './ui'

export function ProductoDialog({
  open,
  onOpenChange,
  proveedorId,
  producto,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proveedorId: string
  producto?: Producto | null
  onCreated?: (producto: Producto) => void
}) {
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const [codigo, setCodigo] = useState(producto?.codigo ?? '')
  const [categoria, setCategoria] = useState(producto?.categoria ?? '')
  const [costo, setCosto] = useState(
    typeof producto?.costo === 'number' ? String(producto.costo) : '',
  )
  const [unidad, setUnidad] = useState(producto?.unidad ?? 'unidad')
  const [moq, setMoq] = useState(typeof producto?.moq === 'number' ? String(producto.moq) : '')
  const [link, setLink] = useState(producto?.link ?? '')
  const [imagen, setImagen] = useState(producto?.imagen ?? '')
  const [notas, setNotas] = useState(producto?.notas ?? '')
  const [error, setError] = useState('')
  const [errorImagen, setErrorImagen] = useState('')
  const [cargandoImagen, setCargandoImagen] = useState(false)
  const [busy, setBusy] = useState(false)

  const settings = useAppSettings()
  const calculo = calcularPrecioVenta(parseNumber(costo), settings.margenGanancia)

  async function handleImagen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setCargandoImagen(true)
    setErrorImagen('')
    try {
      setImagen(await prepararImagen(file))
    } catch (err) {
      setErrorImagen(err instanceof Error ? err.message : 'No se pudo cargar la imagen.')
    } finally {
      setCargandoImagen(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nombre.trim()) {
      setError('Poné un nombre para el producto.')
      return
    }
    setBusy(true)
    try {
      const savedId = await saveProducto(
        {
          proveedorId,
          nombre: nombre.trim(),
          codigo: codigo.trim() || undefined,
          categoria: categoria.trim() || undefined,
          costo: parseNumber(costo),
          unidad: unidad.trim() || undefined,
          moq: parseNumber(moq),
          link: link.trim() || undefined,
          imagen: imagen || undefined,
          notas: notas.trim() || undefined,
        },
        producto?.id,
      )
      if (!producto && onCreated) {
        const creado = await db.productos.get(savedId)
        if (creado) onCreated(creado)
      }
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
                {producto ? 'Editar producto' : 'Nuevo producto'}
              </Dialog.Title>
              <p className={dialogDescriptionClass}>
                Guardá los artículos que pedís habitualmente.
              </p>
            </div>
            <Dialog.Close className={iconButtonClass} aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>
          </div>
          <form className={dialogFormClass} onSubmit={handleSubmit}>
            <div className={formGridClass}>
              <div className={cx(formWideClass, 'flex flex-wrap items-start gap-3')}>
                <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-surface-2">
                  {imagen ? (
                    <img
                      src={imagen}
                      alt="Imagen del producto"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={22} className="text-muted" />
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted">Imagen</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={cx(buttonSecondaryClass, 'cursor-pointer')}>
                      <Upload size={15} />
                      {imagen ? 'Cambiar imagen' : 'Subir imagen'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImagen}
                      />
                    </label>
                    {imagen ? (
                      <Button variant="ghost" size="sm" type="button" onClick={() => setImagen('')}>
                        <Trash2 size={15} />
                        Quitar
                      </Button>
                    ) : null}
                  </div>
                  <span className="text-[11.5px] text-muted">
                    {cargandoImagen
                      ? 'Optimizando imagen…'
                      : 'JPG, PNG o WebP. Se guarda optimizada.'}
                  </span>
                  {errorImagen ? (
                    <span className="text-[11.5px] text-danger">{errorImagen}</span>
                  ) : null}
                </div>
              </div>
              <TextField
                label="Nombre *"
                value={nombre}
                onChange={setNombre}
                placeholder="Ej. Lana merino 100g"
                error={error || undefined}
                autoFocus
                className={formWideClass}
              />
              <TextField
                label="Código"
                value={codigo}
                onChange={setCodigo}
                placeholder="SKU o referencia"
              />
              <TextField
                label="Categoría"
                value={categoria}
                onChange={setCategoria}
                placeholder="Ej. Lanas"
              />
              <TextField
                label="Costo"
                value={costo}
                onChange={setCosto}
                placeholder="0"
                inputMode="decimal"
                hint={
                  calculo
                    ? `Venta sugerida ${formatMoney(calculo.venta, settings)} · Ganancia ${formatMoney(calculo.ganancia, settings)}`
                    : undefined
                }
              />
              <TextField
                label="Unidad"
                value={unidad}
                onChange={setUnidad}
                placeholder="unidad, kg, caja"
              />
              <TextField
                label="Cantidad mínima"
                value={moq}
                onChange={setMoq}
                placeholder="0"
                inputMode="decimal"
              />
              <TextField
                label="Link"
                value={link}
                onChange={setLink}
                placeholder="https://…"
                type="url"
              />
              <TextAreaField
                label="Notas"
                value={notas}
                onChange={setNotas}
                placeholder="Colores, variantes, detalles…"
                rows={2}
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
