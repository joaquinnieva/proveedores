import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Button as BaseButton, type ButtonProps as BaseButtonProps } from '@base-ui/react/button'
import { Field } from '@base-ui/react/field'
import { Input } from '@base-ui/react/input'
import { Select } from '@base-ui/react/select'
import { Check, ChevronsUpDown } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useId, useState } from 'react'
import { cx } from '../lib/cx'
import type { Tone } from '../lib/format'
import {
  buttonBase,
  buttonSecondaryClass,
  buttonSizes,
  buttonVariants,
  dialogActionsClass,
  dialogBackdropClass,
  dialogDescriptionClass,
  dialogPopupClass,
  dialogPopupSmClass,
  dialogTitleClass,
  iconButtonClass,
  iconButtonSmClass,
  inputClass,
  textareaClass,
} from './styles'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const badgeTones: Record<Tone, string> = {
  neutral: 'border-line bg-surface-2 text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-soft text-accent-ink',
  danger: 'bg-danger-soft text-danger',
}

interface ButtonProps extends Omit<BaseButtonProps, 'className'> {
  variant?: Variant
  size?: 'sm' | 'md'
  className?: string
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <BaseButton
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  )
}

export function IconButton({
  label,
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps & { label: string; size?: 'sm' | 'md' }) {
  return (
    <BaseButton
      aria-label={label}
      title={label}
      className={cx(size === 'sm' ? iconButtonSmClass : iconButtonClass, className)}
      type="button"
      {...props}
    >
      {children}
    </BaseButton>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-transparent px-[9px] py-[3px] text-[11.5px] font-semibold leading-normal',
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(24px,3vw,32px)] font-[750] tracking-[-0.02em]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-[34px] text-center">
      <p className="font-semibold">{title}</p>
      {description ? <p className="max-w-[46ch] text-[13px] text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className'> {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  className?: string
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field.Root
      className={cx('flex min-w-0 flex-col gap-[5px]', className)}
      invalid={Boolean(error)}
    >
      <Field.Label className="text-xs font-semibold text-muted">{label}</Field.Label>
      <Input
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {hint ? <span className="text-[11.5px] text-muted">{hint}</span> : null}
      {error ? <span className="text-[11.5px] text-danger">{error}</span> : null}
    </Field.Root>
  )
}

interface TextAreaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'className'> {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  className?: string
}

export function TextAreaField({
  label,
  value,
  onChange,
  hint,
  className,
  ...props
}: TextAreaFieldProps) {
  const id = useId()
  return (
    <div className={cx('flex min-w-0 flex-col gap-[5px]', className)}>
      <label className="text-xs font-semibold text-muted" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={cx(inputClass, textareaClass)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {hint ? <span className="text-[11.5px] text-muted">{hint}</span> : null}
    </div>
  )
}

export interface SelectOption {
  value: string
  label: string
}

export function SelectField({
  label,
  value,
  onChange,
  items,
  placeholder = 'Elegir…',
  disabled,
  error,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  items: SelectOption[]
  placeholder?: string
  disabled?: boolean
  error?: string
  className?: string
}) {
  return (
    <Field.Root
      className={cx('flex min-w-0 flex-col gap-[5px]', className)}
      invalid={Boolean(error)}
    >
      <Field.Label className="text-xs font-semibold text-muted">{label}</Field.Label>
      <Select.Root
        items={items}
        value={value}
        onValueChange={(next) => onChange(typeof next === 'string' ? next : '')}
        disabled={disabled}
      >
        <Select.Trigger className="flex w-full items-center justify-between gap-2 rounded-[9px] border border-line bg-surface px-[11px] py-[9px] text-left text-[13.5px] hover:border-muted focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_var(--color-accent-soft)] focus-visible:outline-none">
          <Select.Value className="truncate" placeholder={placeholder} />
          <Select.Icon className="flex text-muted">
            <ChevronsUpDown size={15} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="z-[60]" sideOffset={6} alignItemWithTrigger={false}>
            <Select.Popup className="max-h-[280px] min-w-[var(--anchor-width,200px)] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)] transition duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none">
              <Select.List className="flex flex-col gap-px">
                {items.map((item) => (
                  <Select.Item
                    key={item.value}
                    value={item.value}
                    className="flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px] outline-none data-[highlighted]:bg-surface-2 data-[selected]:font-semibold data-[selected]:text-accent-ink"
                  >
                    <Select.ItemIndicator className="flex w-4 text-accent-ink">
                      <Check size={15} />
                    </Select.ItemIndicator>
                    <Select.ItemText className="flex-1">{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {error ? <span className="text-[11.5px] text-danger">{error}</span> : null}
    </Field.Root>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Eliminar',
  tone = 'danger',
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  tone?: Variant
  onConfirm: () => void | Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={dialogBackdropClass} />
        <AlertDialog.Popup className={cx(dialogPopupClass, dialogPopupSmClass)}>
          <AlertDialog.Title className={dialogTitleClass}>{title}</AlertDialog.Title>
          {description ? (
            <AlertDialog.Description className={dialogDescriptionClass}>
              {description}
            </AlertDialog.Description>
          ) : null}
          <div className={cx(dialogActionsClass, 'mt-4')}>
            <AlertDialog.Close className={buttonSecondaryClass}>Cancelar</AlertDialog.Close>
            <Button variant={tone} onClick={handleConfirm} disabled={busy} type="button">
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
