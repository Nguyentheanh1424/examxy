import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react'

import { Portal } from '@/components/ui/internal/portal'
import { useControllableState } from '@/components/ui/internal/use-controllable-state'
import { useDismissableLayer } from '@/components/ui/internal/use-dismissable-layer'
import { useLockBodyScroll } from '@/components/ui/internal/use-lock-body-scroll'
import { cn } from '@/lib/utils/cn'

interface DialogContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within <Dialog>.')
  }

  return context
}

export interface DialogProps {
  children: ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Dialog({
  children,
  defaultOpen = false,
  onOpenChange,
  open,
}: DialogProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [isOpen, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    prop: open,
  })

  const value = useMemo<DialogContextValue>(
    () => ({
      open: isOpen,
      setOpen: setIsOpen,
      triggerRef,
    }),
    [isOpen, setIsOpen],
  )

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

export function DialogTrigger({
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, triggerRef } = useDialogContext()

  return (
    <button
      {...props}
      aria-expanded={open}
      onClick={(event) => {
        onClick?.(event)
        setOpen(true)
      }}
      ref={triggerRef}
      type={props.type ?? 'button'}
    >
      {children}
    </button>
  )
}

export function DialogPortal({ children }: { children: ReactNode }) {
  const { open } = useDialogContext()
  if (!open) {
    return null
  }

  return <Portal>{children}</Portal>
}

export function DialogOverlay({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useDialogContext()
  if (!open) {
    return null
  }

  return (
    <div
      {...props}
      className={cn('fixed inset-0 z-50 bg-ink/45 backdrop-blur-sm', className)}
      onClick={() => {
        setOpen(false)
      }}
    />
  )
}

export function DialogContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen, triggerRef } = useDialogContext()
  const contentRef = useRef<HTMLDivElement | null>(null)

  useLockBodyScroll(open)
  useDismissableLayer({
    containerRef: contentRef,
    enabled: open,
    onDismiss: () => {
      setOpen(false)
    },
    triggerRef,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    const focusTarget = contentRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusTarget?.focus()
  }, [open])

  if (!open) {
    return null
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        {...props}
        aria-modal="true"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[min(92vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-panel)] border border-white/80 bg-panel p-6 shadow-[var(--shadow-panel)]',
          className,
        )}
        onClick={(event) => {
          event.stopPropagation()
        }}
        ref={contentRef}
        role="dialog"
      >
        {children}
      </div>
    </DialogPortal>
  )
}

export function DialogClose({
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialogContext()

  return (
    <button
      {...props}
      onClick={(event) => {
        onClick?.(event)
        setOpen(false)
      }}
      type={props.type ?? 'button'}
    >
      {children}
    </button>
  )
}

export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-2 text-left', className)} />
}

export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mt-6 flex flex-wrap justify-end gap-3', className)} />
}

export function DialogTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 {...props} className={cn('text-2xl font-semibold tracking-[-0.03em] text-ink', className)} />
}

export function DialogDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={cn('text-sm leading-6 text-muted', className)} />
}
