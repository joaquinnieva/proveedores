export const buttonBase =
  'inline-flex cursor-pointer items-center justify-center gap-[7px] border border-transparent font-semibold leading-none whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55'

export const buttonVariants = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  secondary: 'border-line bg-surface-2 text-ink hover:border-muted hover:bg-surface',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-[0.94] dark:text-[#1a0d0b]',
} as const

export const buttonSizes = {
  md: 'rounded-[10px] px-3.5 py-[9px] text-[13.5px]',
  sm: 'rounded-[9px] px-2.5 py-[7px] text-[12.5px]',
} as const

type ButtonVariant = keyof typeof buttonVariants
type ButtonSize = keyof typeof buttonSizes

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md') {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]}`
}

export const buttonPrimaryClass = buttonClass('primary')
export const buttonSecondaryClass = buttonClass('secondary')
export const buttonGhostClass = buttonClass('ghost')
export const buttonDangerClass = buttonClass('danger')

const iconButtonBase =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[9px] border border-transparent text-muted transition-colors hover:bg-surface-2 hover:text-ink'

export const iconButtonClass = `${iconButtonBase} size-[34px]`
export const iconButtonSmClass = `${iconButtonBase} size-[30px]`

export const inputClass =
  'w-full rounded-[9px] border border-line bg-surface px-[11px] py-[9px] text-[13.5px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]'
export const textareaClass = 'min-h-[70px] resize-y leading-normal'
export const exportTextClass =
  'w-full min-h-[70px] resize-y rounded-[9px] border border-line bg-surface px-[11px] py-[9px] font-mono text-[12.5px] leading-normal text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]'
export const dialogBackdropClass =
  'fixed inset-0 z-40 bg-[rgb(10_14_11/0.45)] backdrop-blur-[2px] transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 animate-[dialog-backdrop-in_150ms_ease-out] motion-reduce:animate-none motion-reduce:transition-none'

export const dialogPopupClass =
  'fixed left-1/2 top-1/2 z-[41] max-h-[min(86vh,900px)] w-[min(760px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[18px] border border-line bg-surface p-[22px] shadow-[var(--shadow-pop)] transition duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 animate-[dialog-popup-in_180ms_ease-out] motion-reduce:animate-none motion-reduce:transition-none'

export const dialogPopupSmClass = 'w-[min(560px,calc(100vw-32px))]'

export const dialogHeaderClass = 'mb-4 flex items-start justify-between gap-3'

export const dialogTitleClass = 'text-lg font-bold tracking-[-0.01em]'

export const dialogDescriptionClass = 'mt-1 text-[12.5px] text-muted'

export const dialogFormClass = 'flex flex-col gap-4'

export const dialogActionsClass = 'flex flex-wrap items-center justify-end gap-2'

export const dialogActionsSplitClass = 'justify-between'

export const dialogActionsGroupClass = 'flex flex-wrap gap-2'

export const formGridClass = 'grid grid-cols-1 gap-3.5 min-[640px]:grid-cols-2'

export const formWideClass = 'col-span-full'

const pageBase = 'flex w-full flex-col gap-5'
export const pageClass = pageBase
export const backLinkClass =
  'inline-flex w-fit items-center gap-1.5 py-1 text-[13px] text-muted hover:text-ink'
export const loadingClass = 'p-10 text-muted'

export const cardClass =
  'min-w-0 rounded-2xl border border-line bg-surface shadow-[var(--shadow-soft)]'
export const cardDangerClass =
  'min-w-0 rounded-2xl border border-danger/35 bg-surface shadow-[var(--shadow-soft)]'
export const cardHeaderClass = 'mb-3.5 flex flex-wrap items-center justify-between gap-3'
export const cardTitleClass = 'text-[15px] font-semibold tracking-[-0.01em]'
export const linkClass = 'font-semibold text-accent-ink hover:underline'

export const chipsClass = 'my-2.5 flex flex-wrap gap-1.5'
export const chipClass =
  'inline-flex gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-[5px] text-xs hover:border-accent hover:text-accent-ink'
export const tagClass =
  'rounded-md bg-accent-soft px-2 py-[3px] text-[11px] font-semibold text-accent-ink'
export const avatarClass =
  'grid size-[42px] shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-[13px] font-bold text-accent-ink'

export const listClass = 'flex list-none flex-col gap-0.5 p-0'
export const listRowClass =
  'flex items-center justify-between gap-3 rounded-[10px] px-2.5 py-[11px] hover:bg-surface-2'
export const listMainClass = 'flex min-w-0 flex-col gap-0.5'
export const listTitleClass = 'text-[13.5px] font-semibold'
export const listSubtitleClass = 'text-xs text-muted'
export const listNoteClass = 'text-xs italic text-muted'
export const rowActionsClass = 'flex flex-wrap items-center justify-end gap-1'
export const rowBadgesClass = 'flex flex-wrap items-center justify-end gap-1.5'

export const noteClass =
  'mt-3 whitespace-pre-wrap rounded-[10px] bg-surface-2 px-3 py-2.5 text-[13px]'
export const infoListClass = 'mt-3 flex flex-col'
export const infoRowClass =
  'grid grid-cols-[96px_minmax(0,1fr)] gap-2.5 border-b border-dashed border-line py-[7px] text-[13px] last:border-b-0 min-[480px]:grid-cols-[118px_minmax(0,1fr)]'
export const infoLabelClass = 'text-muted'
export const infoValueClass = 'min-w-0 [overflow-wrap:anywhere]'
export const quickActionsClass = 'mt-3.5 flex flex-wrap gap-2'

export const toolbarClass = 'flex flex-wrap items-center gap-3'
export const searchClass = 'relative flex flex-1 basis-[260px] items-center'
export const searchInputClass =
  'w-full rounded-[10px] border border-line bg-surface py-2.5 pl-9 pr-3 text-[13.5px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)]'

const segmentedShell =
  'inline-flex max-w-full gap-0.5 rounded-[10px] border border-line bg-surface-2 p-[3px]'
export const segmentedClass = segmentedShell

const segmentedItemBase =
  'inline-flex items-center gap-1 whitespace-nowrap rounded-[7px] border-0 px-[11px] py-1.5 text-[12.5px] font-semibold'
export const segmentedItemClass = `${segmentedItemBase} bg-transparent text-muted hover:text-ink`
export const segmentedItemActiveClass = `${segmentedItemBase} bg-surface text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]`

const segmentedCountBase = 'rounded-full px-[5px] py-px text-[10.5px]'
export const segmentedCountClass = `${segmentedCountBase} bg-surface-2 text-muted`
export const segmentedCountActiveClass = `${segmentedCountBase} bg-accent-soft text-accent-ink`

export const detailGridClass = 'grid grid-cols-1 items-start gap-5 min-[900px]:grid-cols-2'
export const detailWideClass = 'col-span-full'

export const tableWrapClass = 'mt-1 overflow-x-auto'
export const tableClass = 'w-full border-collapse text-[13px] [&_tr:last-child_td]:border-b-0'
export const thClass =
  'border-b border-line px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted'
export const tdClass = 'border-b border-line px-2.5 py-2.5 align-middle'
