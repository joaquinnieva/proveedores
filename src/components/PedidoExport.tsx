import { Dialog } from '@base-ui/react/dialog'
import { Check, Copy, Mail, MessageCircle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { registrarContacto } from '../db/repo'
import { cx } from '../lib/cx'
import { buildPedidoText, mailtoLink, pedidoSubject, whatsappLink } from '../lib/pedido'
import type { Pedido, PedidoItem, Proveedor, Settings } from '../types'
import {
  buttonSecondaryClass,
  dialogActionsClass,
  dialogActionsGroupClass,
  dialogActionsSplitClass,
  dialogBackdropClass,
  dialogDescriptionClass,
  dialogHeaderClass,
  dialogPopupClass,
  dialogTitleClass,
  exportTextClass,
  iconButtonClass,
} from './styles'
import { Button } from './ui'

export function PedidoExport({
  open,
  onOpenChange,
  pedido,
  proveedor,
  items,
  settings,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pedido: Pedido
  proveedor: Proveedor
  items: PedidoItem[]
  settings: Settings
}) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'error'>('idle')

  const texto = buildPedidoText({ pedido, proveedor, items, settings })
  const whatsapp = whatsappLink(proveedor.whatsapp ?? proveedor.telefono, texto)
  const email = mailtoLink(proveedor.email, pedidoSubject(pedido, proveedor), texto)

  useEffect(() => {
    if (copied === 'idle') return
    const timer = setTimeout(() => setCopied('idle'), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopied('ok')
    } catch {
      setCopied('error')
    }
  }

  function handleContacto() {
    void registrarContacto(proveedor.id)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className={dialogBackdropClass} />
        <Dialog.Popup className={dialogPopupClass}>
          <div className={dialogHeaderClass}>
            <div>
              <Dialog.Title className={dialogTitleClass}>Enviar pedido</Dialog.Title>
              <p className={dialogDescriptionClass}>
                Revisá el texto y mandalo por WhatsApp, email o copialo.
              </p>
            </div>
            <Dialog.Close className={iconButtonClass} aria-label="Cerrar">
              <X size={18} />
            </Dialog.Close>
          </div>
          <textarea
            className={exportTextClass}
            value={texto}
            readOnly
            rows={12}
            aria-label="Texto del pedido"
          />
          {!whatsapp && !email ? (
            <p className="text-[11.5px] text-muted">
              Cargá el WhatsApp o el email del proveedor para enviarlo directo.
            </p>
          ) : null}
          <div className={cx(dialogActionsClass, dialogActionsSplitClass, 'mt-4')}>
            <Button variant="primary" onClick={handleCopy} type="button">
              {copied === 'ok' ? <Check size={16} /> : <Copy size={16} />}
              {copied === 'ok'
                ? 'Copiado'
                : copied === 'error'
                  ? 'No se pudo copiar'
                  : 'Copiar texto'}
            </Button>
            <div className={dialogActionsGroupClass}>
              {whatsapp ? (
                <a
                  className={buttonSecondaryClass}
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleContacto}
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              ) : null}
              {email ? (
                <a className={buttonSecondaryClass} href={email} onClick={handleContacto}>
                  <Mail size={16} />
                  Email
                </a>
              ) : null}
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
