import { Dialog } from '@base-ui/react/dialog'
import { Check, Copy, ListChecks, RotateCcw, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAppSettings } from '../db/db'
import { aplicarImportacion } from '../db/repo'
import { cx } from '../lib/cx'
import type { Tone } from '../lib/format'
import { formatMoney } from '../lib/format'
import {
  buildImportPrompt,
  type FilaImportada,
  type FilaPlan,
  type ModoImportacion,
  type ProductoImportado,
  parsearImportacion,
  planificarImportacion,
  type ResultadoImportacion,
  resumirPlan,
} from '../lib/importProductos'
import type { Producto, Proveedor } from '../types'
import {
  buttonSecondaryClass,
  cardClass,
  dialogActionsClass,
  dialogActionsSplitClass,
  dialogBackdropClass,
  dialogDescriptionClass,
  dialogHeaderClass,
  dialogPopupClass,
  dialogTitleClass,
  exportTextClass,
  formWideClass,
  iconButtonClass,
  tableClass,
  tableWrapClass,
  tdClass,
  thClass,
} from './styles'
import { Badge, Button, IconButton, SelectField } from './ui'

const ESTADO_PLAN: Record<FilaPlan['estado'], { label: string; tone: Tone }> = {
  crear: { label: 'Nuevo', tone: 'success' },
  actualizar: { label: 'Actualizar', tone: 'info' },
  omitir: { label: 'Ya existe', tone: 'neutral' },
  error: { label: 'Error', tone: 'danger' },
}

function promptDelProveedor(proveedor: Proveedor, moneda: string): string {
  return buildImportPrompt({ proveedor: proveedor.nombre, moneda })
}

function detalleProducto(producto?: ProductoImportado): string {
  if (!producto) return '—'
  const partes = [producto.unidad, typeof producto.moq === 'number' ? `mín. ${producto.moq}` : '']
  return partes.filter(Boolean).join(' · ') || '—'
}

export function ImportarProductosDialog({
  open,
  onOpenChange,
  proveedor,
  productosExistentes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proveedor: Proveedor
  productosExistentes: Producto[]
}) {
  const settings = useAppSettings()
  const prompt = useMemo(
    () => promptDelProveedor(proveedor, settings.moneda),
    [proveedor, settings.moneda],
  )

  const [texto, setTexto] = useState('')
  const [filas, setFilas] = useState<FilaImportada[] | null>(null)
  const [excluidas, setExcluidas] = useState<Set<number>>(new Set())
  const [modo, setModo] = useState<ModoImportacion>('omitir')
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)

  useEffect(() => {
    if (!copiado) return
    const timer = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(timer)
  }, [copiado])

  const planBase = useMemo(
    () => (filas ? planificarImportacion(filas, productosExistentes, modo) : null),
    [filas, productosExistentes, modo],
  )
  const plan = useMemo(
    () =>
      planBase?.map((fila) =>
        excluidas.has(fila.indice)
          ? {
              ...fila,
              estado: 'omitir' as const,
              excluida: true,
              mensaje: 'Lo quitaste de esta importación.',
            }
          : fila,
      ) ?? null,
    [planBase, excluidas],
  )
  const resumen = useMemo(() => (plan ? resumirPlan(plan) : null), [plan])
  const quitados = useMemo(() => (plan ? plan.filter((fila) => fila.excluida).length : 0), [plan])
  const yaExisten = resumen ? resumen.omitir - quitados : 0
  const importables = resumen ? resumen.crear + resumen.actualizar : 0

  function alternarExclusion(indice: number) {
    setExcluidas((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(indice)) siguiente.delete(indice)
      else siguiente.add(indice)
      return siguiente
    })
  }

  async function copiarPrompt() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiado(true)
    } catch {
      setError('No se pudo copiar el prompt. Seleccionalo y copialo a mano.')
    }
  }

  function revisar() {
    const resultadoParseo = parsearImportacion(texto)
    if (resultadoParseo.error) {
      setError(resultadoParseo.error)
      setFilas(null)
      return
    }
    if (resultadoParseo.filas.length === 0) {
      setError('El JSON no contiene productos.')
      setFilas(null)
      return
    }
    setError('')
    setExcluidas(new Set())
    setFilas(resultadoParseo.filas)
  }

  async function importar() {
    if (!plan) return
    setBusy(true)
    setError('')
    try {
      const resumenImportacion = await aplicarImportacion(proveedor.id, plan)
      if (resumenImportacion.creados === 0 && resumenImportacion.actualizados === 0) {
        setError('No había productos nuevos ni para actualizar con el modo elegido.')
        return
      }
      setResultado(resumenImportacion)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar el catálogo.')
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
                {resultado ? 'Catálogo importado' : 'Importar productos'}
              </Dialog.Title>
              <p className={dialogDescriptionClass}>
                {resultado
                  ? `Los cambios ya están guardados en ${proveedor.nombre}.`
                  : 'Pegá el JSON que generó la IA con tu catálogo. Podés revisarlo antes de guardar.'}
              </p>
            </div>
            <Dialog.Close className={iconButtonClass} aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>
          </div>

          {resultado ? (
            <div className="flex flex-col gap-4">
              <div className={cx(cardClass, 'flex flex-col items-center gap-2 p-7 text-center')}>
                <span className="grid size-11 place-items-center rounded-full bg-success-soft text-success">
                  <Check size={22} />
                </span>
                <p className="text-base font-semibold">Importación terminada</p>
                <p className="text-[13px] text-muted">
                  {resultado.creados} productos nuevos · {resultado.actualizados} actualizados ·{' '}
                  {resultado.omitidos} omitidos
                </p>
              </div>
              <div className={cx(dialogActionsClass, 'justify-end')}>
                <Button variant="primary" type="button" onClick={() => onOpenChange(false)}>
                  Listo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <section className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-1.5 text-[13px] font-bold">
                    <Sparkles size={15} className="text-accent-ink" />
                    1. Prompt para la IA
                  </h3>
                  <Button variant="secondary" size="sm" type="button" onClick={copiarPrompt}>
                    {copiado ? <Check size={15} /> : <Copy size={15} />}
                    {copiado ? 'Copiado' : 'Copiar prompt'}
                  </Button>
                </div>
                <p className="text-[12px] text-muted">
                  Copiá el prompt y pegalo en tu IA junto con el catálogo (texto, tabla, PDF o
                  captura). Te va a devolver el JSON con el formato que pide esta pantalla.
                </p>
                <pre
                  className={cx(
                    exportTextClass,
                    'max-h-[190px] overflow-auto whitespace-pre-wrap bg-surface-2 px-3 py-2.5',
                  )}
                >
                  {prompt}
                </pre>
              </section>

              <section className="flex flex-col gap-2.5">
                <h3 className="flex items-center gap-1.5 text-[13px] font-bold">
                  <ListChecks size={15} className="text-accent-ink" />
                  2. Pegá el JSON
                </h3>
                <textarea
                  className={exportTextClass}
                  value={texto}
                  onChange={(event) => {
                    setTexto(event.target.value)
                    setFilas(null)
                    setExcluidas(new Set())
                    setError('')
                  }}
                  rows={8}
                  placeholder={
                    '[\n  {\n    "nombre": "Lana merino 100 g",\n    "costo": 4500.5\n  }\n]'
                  }
                  aria-label="JSON con los productos a importar"
                />
                {error ? (
                  <p className="rounded-[10px] bg-danger-soft px-3 py-2 text-[12.5px] text-danger">
                    {error}
                  </p>
                ) : null}
                <div>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={revisar}
                    disabled={!texto.trim()}
                  >
                    Revisar catálogo
                  </Button>
                </div>
              </section>

              {plan && resumen ? (
                <section className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[13px] font-bold">3. Revisá y confirmá</h3>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Badge tone="success">{resumen.crear} nuevos</Badge>
                      {resumen.actualizar > 0 ? (
                        <Badge tone="info">{resumen.actualizar} a actualizar</Badge>
                      ) : null}
                      {yaExisten > 0 ? <Badge tone="neutral">{yaExisten} ya existen</Badge> : null}
                      {quitados > 0 ? <Badge tone="neutral">{quitados} quitados</Badge> : null}
                      {resumen.error > 0 ? (
                        <Badge tone="danger">{resumen.error} con error</Badge>
                      ) : null}
                      {quitados > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => setExcluidas(new Set())}
                        >
                          <RotateCcw size={14} />
                          Restaurar quitados
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {yaExisten + resumen.actualizar > 0 ? (
                    <SelectField
                      label="Si el producto ya existe en el catálogo"
                      value={modo}
                      onChange={(value) =>
                        setModo(value === 'actualizar' ? 'actualizar' : 'omitir')
                      }
                      items={[
                        { value: 'omitir', label: 'Omitirlo y dejar el actual' },
                        { value: 'actualizar', label: 'Actualizar sus datos y costo' },
                      ]}
                      className={formWideClass}
                    />
                  ) : null}

                  <div className={cx(tableWrapClass, 'max-h-[300px] overflow-auto')}>
                    <table className={tableClass}>
                      <thead>
                        <tr>
                          <th className={cx(thClass, 'text-left')}>Producto</th>
                          <th className={cx(thClass, 'text-left')}>Categoría</th>
                          <th className={cx(thClass, 'text-right')}>Costo</th>
                          <th className={cx(thClass, 'text-left')}>Unidad</th>
                          <th className={thClass}>Estado</th>
                          <th className={thClass} aria-label="Quitar" />
                        </tr>
                      </thead>
                      <tbody>
                        {plan.map((fila) => {
                          const estado = fila.excluida
                            ? { label: 'Quitado', tone: 'neutral' as Tone }
                            : ESTADO_PLAN[fila.estado]
                          return (
                            <tr key={fila.indice}>
                              <td className={tdClass}>
                                <div className="flex items-center gap-2.5">
                                  {fila.producto?.imagen ? (
                                    <img
                                      src={fila.producto.imagen}
                                      alt=""
                                      className="size-9 shrink-0 rounded-lg border border-line object-cover"
                                      onError={(event) => {
                                        event.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : null}
                                  <div className="min-w-0">
                                    <span
                                      className={cx(
                                        'block font-semibold',
                                        fila.excluida && 'text-muted line-through',
                                      )}
                                    >
                                      {fila.producto?.nombre ?? 'Fila inválida'}
                                    </span>
                                    {fila.producto?.codigo ? (
                                      <span className="block text-[11.5px] text-muted">
                                        Cód. {fila.producto.codigo}
                                      </span>
                                    ) : null}
                                    {fila.mensaje ? (
                                      <span
                                        className={cx(
                                          'block text-[11.5px]',
                                          fila.estado === 'error' ? 'text-danger' : 'text-muted',
                                        )}
                                      >
                                        {fila.mensaje}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td className={tdClass}>{fila.producto?.categoria ?? '—'}</td>
                              <td className={cx(tdClass, 'text-right')}>
                                {typeof fila.producto?.costo === 'number'
                                  ? formatMoney(fila.producto.costo, settings)
                                  : '—'}
                              </td>
                              <td className={tdClass}>{detalleProducto(fila.producto)}</td>
                              <td className={tdClass}>
                                <div className="flex justify-end">
                                  <Badge tone={estado.tone}>{estado.label}</Badge>
                                </div>
                              </td>
                              <td className={tdClass}>
                                <div className="flex justify-end">
                                  {fila.excluida ? (
                                    <IconButton
                                      size="sm"
                                      label="Volver a incluir este producto"
                                      onClick={() => alternarExclusion(fila.indice)}
                                    >
                                      <RotateCcw size={15} />
                                    </IconButton>
                                  ) : (
                                    <IconButton
                                      size="sm"
                                      label="No importar este producto"
                                      onClick={() => alternarExclusion(fila.indice)}
                                    >
                                      <Trash2 size={15} />
                                    </IconButton>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              <div className={cx(dialogActionsClass, dialogActionsSplitClass)}>
                <span className="text-[11.5px] text-muted">
                  {plan
                    ? `${importables} producto${importables === 1 ? '' : 's'} listo${importables === 1 ? '' : 's'} para guardar`
                    : 'El catálogo actual no se modifica hasta que confirmes.'}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Dialog.Close className={buttonSecondaryClass} type="button">
                    Cancelar
                  </Dialog.Close>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={importar}
                    disabled={!plan || importables === 0 || busy}
                  >
                    <Upload size={16} />
                    {busy ? 'Importando…' : `Importar ${importables || ''}`.trim()}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
