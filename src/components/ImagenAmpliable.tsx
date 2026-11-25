import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { useState } from 'react'
import { cx } from '../lib/cx'
import { dialogBackdropClass } from './styles'

export function ImagenAmpliable({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(false)

  if (error) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx(
          'group relative shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-line bg-surface-2 transition-colors hover:border-accent',
          className,
        )}
        aria-label={`Ampliar imagen de ${alt}`}
        title="Ver imagen más grande"
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          loading="lazy"
          onError={() => setError(true)}
          className="size-full object-cover"
        />
      </button>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={dialogBackdropClass} />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-[41] flex max-h-[92dvh] w-[min(1100px,92vw)] -translate-x-1/2 -translate-y-1/2 items-center justify-center outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            <Dialog.Title className="sr-only">{alt}</Dialog.Title>
            <div className="relative flex max-h-[88dvh] items-center justify-center">
              <img
                src={src}
                alt={alt}
                className="max-h-[88dvh] max-w-full rounded-xl border border-white/10 object-contain shadow-[0_24px_80px_rgb(0_0_0/0.45)]"
              />
              <Dialog.Close
                className="absolute right-2 top-2 grid size-10 cursor-pointer place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition-colors hover:bg-black/75"
                aria-label="Cerrar imagen"
              >
                <X size={20} />
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
