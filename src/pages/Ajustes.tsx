import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import {
  buttonSecondaryClass,
  cardClass,
  cardDangerClass,
  cardHeaderClass,
  cardTitleClass,
  dialogActionsClass,
  dialogActionsSplitClass,
  dialogFormClass,
  formGridClass,
  formWideClass,
  pageClass,
  quickActionsClass,
} from '../components/styles'
import { Button, ConfirmDialog, PageHeader, SelectField, TextField } from '../components/ui'
import { exportBackup, getCounts, importBackup } from '../db/backup'
import { saveSettings, useAppSettings } from '../db/db'
import { clearData } from '../db/repo'
import { cx } from '../lib/cx'
import { formatMoney, parseNumber } from '../lib/format'
import type { Settings } from '../types'
import { MONEDAS } from '../types'

function PreferenciasForm({
  settings,
  saved,
  onSaved,
}: {
  settings: Settings
  saved: boolean
  onSaved: () => void
}) {
  const [nombreNegocio, setNombreNegocio] = useState(settings.nombreNegocio)
  const [moneda, setMoneda] = useState(settings.moneda)
  const [locale, setLocale] = useState(settings.locale)
  const [margen, setMargen] = useState(
    typeof settings.margenGanancia === 'number' ? String(settings.margenGanancia) : '',
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await saveSettings({
      id: 'app',
      nombreNegocio,
      moneda,
      locale,
      margenGanancia: parseNumber(margen),
    })
    onSaved()
  }

  return (
    <form className={dialogFormClass} onSubmit={handleSubmit}>
      <div className={formGridClass}>
        <TextField
          label="Nombre del negocio"
          value={nombreNegocio}
          onChange={setNombreNegocio}
          placeholder="Opcional"
          className={formWideClass}
        />
        <SelectField
          label="Moneda"
          value={moneda}
          onChange={setMoneda}
          items={MONEDAS.map((item) => ({ value: item, label: item }))}
        />
        <TextField
          label="Formato regional"
          value={locale}
          onChange={setLocale}
          placeholder="es-AR"
          hint={`Ejemplo: ${formatMoney(1234.5, { moneda, locale })}`}
        />
        <TextField
          label="Margen de ganancia (%)"
          value={margen}
          onChange={setMargen}
          placeholder="Ej. 40"
          inputMode="decimal"
          hint="Sugiere el precio de venta al cargar un producto."
        />
      </div>
      <div className={cx(dialogActionsClass, dialogActionsSplitClass)}>
        <span className="text-xs font-semibold text-success">
          {saved ? 'Preferencias guardadas' : ''}
        </span>
        <Button variant="primary" type="submit">
          Guardar preferencias
        </Button>
      </div>
    </form>
  )
}

export function Ajustes() {
  const settings = useAppSettings()
  const counts = useLiveQuery(() => getCounts(), [])

  const [saved, setSaved] = useState(false)
  const [message, setMessage] = useState('')
  const [pendingImport, setPendingImport] = useState<File | null>(null)
  const [clearOpen, setClearOpen] = useState(false)

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2000)
    return () => clearTimeout(timer)
  }, [saved])

  async function handleExport() {
    setMessage('')
    try {
      const result = await exportBackup()
      setMessage(
        `Backup descargado: ${result.proveedores} proveedores, ${result.productos} productos, ${result.pedidos} pedidos.`,
      )
    } catch {
      setMessage('No se pudo generar el backup.')
    }
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) setPendingImport(file)
  }

  async function confirmarImport() {
    if (!pendingImport) return
    setMessage('')
    try {
      const result = await importBackup(pendingImport)
      setMessage(
        `Backup importado: ${result.proveedores} proveedores, ${result.productos} productos, ${result.pedidos} pedidos.`,
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo importar el backup.')
    } finally {
      setPendingImport(null)
    }
  }

  return (
    <div className={pageClass}>
      <PageHeader title="Ajustes" subtitle="Preferencias y respaldo de tus datos." />

      <section className={`${cardClass} p-5`}>
        <div className={cardHeaderClass}>
          <h2 className={cardTitleClass}>Preferencias</h2>
        </div>
        <PreferenciasForm
          key={`${settings.nombreNegocio}|${settings.moneda}|${settings.locale}|${settings.margenGanancia ?? ''}`}
          settings={settings}
          saved={saved}
          onSaved={() => setSaved(true)}
        />
      </section>

      <section className={`${cardClass} p-5`}>
        <div className={cardHeaderClass}>
          <h2 className={cardTitleClass}>Datos</h2>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2.5 min-[640px]:grid-cols-5">
          <div className="flex flex-col gap-0.5 rounded-[10px] bg-surface-2 px-3 py-2.5">
            <span className="text-[19px] font-[750]">{counts?.proveedores ?? 0}</span>
            <span className="text-[11px] text-muted">Proveedores</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[10px] bg-surface-2 px-3 py-2.5">
            <span className="text-[19px] font-[750]">{counts?.contactos ?? 0}</span>
            <span className="text-[11px] text-muted">Contactos</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[10px] bg-surface-2 px-3 py-2.5">
            <span className="text-[19px] font-[750]">{counts?.productos ?? 0}</span>
            <span className="text-[11px] text-muted">Productos</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[10px] bg-surface-2 px-3 py-2.5">
            <span className="text-[19px] font-[750]">{counts?.pedidos ?? 0}</span>
            <span className="text-[11px] text-muted">Pedidos</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-[10px] bg-surface-2 px-3 py-2.5">
            <span className="text-[19px] font-[750]">{counts?.items ?? 0}</span>
            <span className="text-[11px] text-muted">Ítems</span>
          </div>
        </div>
        <p className="text-[11.5px] text-muted">
          Todo se guarda en este navegador. Exportá un backup antes de cambiar de equipo o borrar
          los datos del navegador.
        </p>
        <div className={quickActionsClass}>
          <Button variant="secondary" type="button" onClick={() => void handleExport()}>
            <Download size={16} />
            Exportar backup
          </Button>
          <label className={cx(buttonSecondaryClass, 'cursor-pointer')}>
            <Upload size={16} />
            Importar backup
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={handleFile}
            />
          </label>
        </div>
        {message ? (
          <p className="mt-3 rounded-[10px] bg-info-soft px-3 py-2.5 text-[12.5px] text-info">
            {message}
          </p>
        ) : null}
      </section>

      <section className={cx(cardDangerClass, 'p-5')}>
        <div className={cardHeaderClass}>
          <h2 className={cardTitleClass}>Zona de riesgo</h2>
        </div>
        <p className="text-[11.5px] text-muted">
          Borra todos los proveedores, contactos, productos y pedidos de este navegador. No se puede
          deshacer.
        </p>
        <Button variant="danger" type="button" onClick={() => setClearOpen(true)}>
          Borrar todos los datos
        </Button>
      </section>

      <ConfirmDialog
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null)
        }}
        title="Importar backup"
        description="Se van a reemplazar todos los datos actuales por los del archivo. ¿Continuar?"
        confirmLabel="Importar"
        tone="primary"
        onConfirm={confirmarImport}
      />

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Borrar todos los datos"
        description="Se van a eliminar todos los proveedores, contactos, productos y pedidos. Esta acción no se puede deshacer."
        confirmLabel="Borrar todo"
        onConfirm={async () => {
          await clearData()
        }}
      />
    </div>
  )
}
