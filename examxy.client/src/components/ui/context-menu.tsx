import { Check, ChevronRight, Circle } from 'lucide-react'
import { createContext, useContext, useMemo, useRef, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import { Portal } from '@/components/ui/internal/portal'
import { useDismissableLayer } from '@/components/ui/internal/use-dismissable-layer'
import { cn } from '@/lib/utils/cn'

interface ContextMenuState {
  open: boolean
  position: { x: number; y: number }
  setOpen: (open: boolean) => void
  setPosition: (position: { x: number; y: number }) => void
}

const ContextMenuContext = createContext<ContextMenuState | null>(null)

function useContextMenuState() {
  const context = useContext(ContextMenuContext)
  if (!context) {
    throw new Error('ContextMenu components must be used within <ContextMenu>.')
  }

  return context
}

export function ContextMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const value = useMemo(
    () => ({ open, position, setOpen, setPosition }),
    [open, position],
  )

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
    </ContextMenuContext.Provider>
  )
}

export function ContextMenuTrigger({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { setOpen, setPosition } = useContextMenuState()

  return (
    <div
      {...props}
      className={className}
      onContextMenu={(event) => {
        event.preventDefault()
        setPosition({ x: event.clientX, y: event.clientY })
        setOpen(true)
      }}
    >
      {children}
    </div>
  )
}

export function ContextMenuContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { open, position, setOpen } = useContextMenuState()
  const contentRef = useRef<HTMLDivElement | null>(null)

  useDismissableLayer({
    containerRef: contentRef,
    enabled: open,
    onDismiss: () => {
      setOpen(false)
    },
  })

  if (!open) {
    return null
  }

  return (
    <Portal>
      <div
        {...props}
        className={cn(
          'fixed z-50 min-w-52 rounded-[calc(var(--radius-panel)-0.5rem)] border border-line/80 bg-panel p-1 shadow-[var(--shadow-panel)]',
          className,
        )}
        ref={contentRef}
        style={{ left: position.x, top: position.y }}
      >
        {children}
      </div>
    </Portal>
  )
}

export function ContextMenuItem({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn('flex w-full items-center gap-2 rounded-[calc(var(--radius-input)-0.25rem)] px-3 py-2 text-left text-sm text-ink transition hover:bg-brand-soft/60', className)}
      type={props.type ?? 'button'}
    />
  )
}

export function ContextMenuCheckboxItem({
  checked = false,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean }) {
  return (
    <ContextMenuItem {...props} className={className}>
      <Check className={cn('size-4 text-brand-strong', checked ? 'opacity-100' : 'opacity-0')} />
      {children}
    </ContextMenuItem>
  )
}

export function ContextMenuRadioItem({
  checked = false,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean }) {
  return (
    <ContextMenuItem {...props} className={className}>
      <Circle className={cn('size-4 text-brand-strong', checked ? 'fill-current opacity-100' : 'opacity-35')} />
      {children}
    </ContextMenuItem>
  )
}

export function ContextMenuLabel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong', className)} />
}

export function ContextMenuSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('my-1 h-px bg-line', className)} />
}

export function ContextMenuShortcut({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span {...props} className={cn('ml-auto text-xs tracking-[0.16em] text-muted', className)} />
}

export function ContextMenuGroup({ children }: { children: ReactNode }) {
  return <div className="grid gap-1">{children}</div>
}

export function ContextMenuPortal({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function ContextMenuSub({ children }: { children: ReactNode }) {
  return <div className="grid gap-1">{children}</div>
}

export function ContextMenuSubTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ContextMenuItem {...props} className={cn('justify-between', className)}>
      <span>{children}</span>
      <ChevronRight className="size-4 text-muted" />
    </ContextMenuItem>
  )
}

export function ContextMenuSubContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('ml-3 grid gap-1 border-l border-line pl-3', className)} />
}

export function ContextMenuRadioGroup({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('grid gap-1', className)} />
}
